from datetime import datetime, timedelta
import os
import re
import shutil
import sqlite3
from scripts.iib.tool import (
    human_readable_size,
    is_valid_image_path,
    temp_path,
    read_info_from_image,
    get_formatted_date,
    is_win,
    cwd,
    locale,
    enable_access_control,
    get_windows_drives,
    get_sd_webui_conf,
    get_valid_img_dirs,
    open_folder,
    get_img_geninfo_txt_path
)
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
import asyncio
from typing import Any, List, Optional, TypedDict
from pydantic import BaseModel
from fastapi.responses import FileResponse
from PIL import Image
from fastapi import Depends, FastAPI, HTTPException, Request
import hashlib
from scripts.iib.db.datamodel import (
    DataBase,
    Image as DbImg,
    Tag,
    Floder,
    ImageTag,
    ExtraPath,
)
from scripts.iib.db.update_image_data import update_image_data
from scripts.iib.logger import logger


index_html_path = os.path.join(cwd, "vue/dist/index.html")  # 在app.py也被使用


send_img_path = {"value": ""}
mem = {
    "IIB_SECRET_KEY_HASH" : None,
    "EXTRA_PATHS": []
}
secret_key = os.getenv("IIB_SECRET_KEY")
if secret_key:
    print("Secret key loaded successfully. ")

async def get_token(request: Request):
    if not secret_key:
        return
    token = request.cookies.get("IIB_S")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not mem["IIB_SECRET_KEY_HASH"]:
        mem["IIB_SECRET_KEY_HASH"] = hashlib.sha256((secret_key+"_ciallo").encode("utf-8")).hexdigest()
    if mem["IIB_SECRET_KEY_HASH"] != token:
        raise HTTPException(status_code=401, detail="Unauthorized")


def infinite_image_browsing_api(app: FastAPI, **kwargs):
    pre = "/infinite_image_browsing"


    img_search_dirs = []
    try:
        img_search_dirs = get_valid_img_dirs(get_sd_webui_conf(**kwargs))
    except:
        pass


    def update_extra_paths(conn: sqlite3.Connection):
        r = ExtraPath.get_extra_paths(conn, "scanned")
        mem["EXTRA_PATHS"] = [x.path for x in r]


    def safe_commonpath(seq):
        try:
            return os.path.commonpath(seq)
        except Exception as e:
            logger.error(e)
            return ''

    def is_path_under_parents(path, parent_paths: List[str] = []):
        """
        Check if the given path is under one of the specified parent paths.
        :param path: The path to check.
        :param parent_paths: A list of parent paths.
        :return: True if the path is under one of the parent paths, False otherwise.
        """
        try:
            if not parent_paths:
                parent_paths = img_search_dirs + mem["EXTRA_PATHS"] + kwargs.get("extra_paths_cli", [])
            path = os.path.normpath(path)
            for parent_path in parent_paths:
                if (safe_commonpath([path, parent_path]) == parent_path):
                    return True
        except Exception as e:
            logger.error(e)
        return False

    def is_path_trusted(path: str):
        if not enable_access_control:
            return True
        try:
            parent_paths: List[str] = img_search_dirs + mem["EXTRA_PATHS"] + kwargs.get("extra_paths_cli", [])
            path = os.path.normpath(path)
            for parent_path in parent_paths:
                if (len(path) <= len(parent_path)):
                    if parent_path.startswith(path):
                        return True
                else:
                    if path.startswith(parent_path):
                        return True
        except:
            pass
        return False

    def check_path_trust(path: str):
        if not is_path_trusted(path):
            raise HTTPException(status_code=403)

    app.mount(
        f"{pre}/fe-static",
        StaticFiles(directory=f"{cwd}/vue/dist"),
        name="infinite_image_browsing-fe-static",
    )

    @app.get(f"{pre}/hello")
    async def greeting():
        return "hello"

    @app.get(f"{pre}/global_setting", dependencies=[Depends(get_token)])
    async def global_setting():
        all_custom_tags = []

        extra_paths = []
        try:
            conn = DataBase.get_conn()
            all_custom_tags = Tag.get_all_custom_tag(conn)
            extra_paths = ExtraPath.get_extra_paths(conn) + [ExtraPath(path, "cli_access_only") for path in kwargs.get("extra_paths_cli", [])]
            update_extra_paths(conn)
        except Exception as e:
            print(e)
        return {
            "global_setting": get_sd_webui_conf(**kwargs),
            "cwd": cwd,
            "is_win": is_win,
            "home": os.environ.get("USERPROFILE") if is_win else os.environ.get("HOME"),
            "sd_cwd": os.getcwd(),
            "all_custom_tags": all_custom_tags,
            "extra_paths": extra_paths,
            "enable_access_control": enable_access_control
        }

    class DeleteFilesReq(BaseModel):
        file_paths: List[str]

    @app.post(pre + "/delete_files", dependencies=[Depends(get_token)])
    async def delete_files(req: DeleteFilesReq):
        conn = DataBase.get_conn()
        for path in req.file_paths:
            check_path_trust(path)
            try:
                if os.path.isdir(path):
                    if len(os.listdir(path)):
                        error_msg = (
                            "When a folder is not empty, it is not allowed to be deleted."
                            if locale == "en"
                            else "文件夹不为空时不允许删除。"
                        )
                        raise HTTPException(400, detail=error_msg)
                    shutil.rmtree(path)
                else:
                    os.remove(path)
                    txt_path = get_img_geninfo_txt_path(path)
                    if txt_path:
                        os.remove(txt_path)
                    img = DbImg.get(conn, os.path.normpath(path))
                    if img:
                        logger.info("delete file: %s", path)
                        ImageTag.remove(conn, img.id)
                        DbImg.remove(conn, img.id)
            except OSError as e:
                # 处理删除失败的情况
                logger.error("delete failed")
                error_msg = (
                    f"Error deleting file {path}: {e}"
                    if locale == "en"
                    else f"删除文件 {path} 时出错：{e}"
                )
                raise HTTPException(400, detail=error_msg)

    class MoveFilesReq(BaseModel):
        file_paths: List[str]
        dest: str

    @app.post(pre + "/move_files", dependencies=[Depends(get_token)])
    async def move_files(req: MoveFilesReq):
        conn = DataBase.get_conn()
        for path in req.file_paths:
            check_path_trust(path)
            try:
                shutil.move(path, req.dest)
                txt_path = get_img_geninfo_txt_path(path)
                if txt_path:
                    shutil.move(txt_path, req.dest)
                img = DbImg.get(conn, os.path.normpath(path))
                if img:
                    DbImg.safe_batch_remove(conn, [img.id])
            except OSError as e:
                error_msg = (
                    f"Error moving file {path} to {req.dest}: {e}"
                    if locale == "en"
                    else f"移动文件 {path} 到 {req.dest} 时出错：{e}"
                )
                raise HTTPException(400, detail=error_msg)

    class FileInfoDict(TypedDict):
        type: str
        date: float
        size: int
        name: str
        bytes: bytes
        created_time: float
        fullpath: str

    @app.get(pre + "/files", dependencies=[Depends(get_token)])
    async def get_target_floder_files(folder_path: str):
        files: List[FileInfoDict] = []
        try:
            if is_win and folder_path == "/":
                for item in get_windows_drives():
                    files.append(
                        {"type": "dir", "size": "-", "name": item, "fullpath": item}
                    )
            else:
                if not os.path.exists(folder_path):
                    return {"files": []}
                check_path_trust(folder_path)
                folder_listing: List[os.DirEntry] = os.scandir(folder_path)
                for item in folder_listing:
                    if not os.path.exists(item.path):
                        continue
                    fullpath = os.path.normpath(item.path)
                    name = os.path.basename(item.path)
                    date = get_formatted_date(item.stat().st_mtime)
                    created_time = get_formatted_date(item.stat().st_ctime)
                    if item.is_file():
                        bytes = item.stat().st_size
                        size = human_readable_size(bytes)
                        files.append(
                            {
                                "type": "file",
                                "date": date,
                                "size": size,
                                "name": name,
                                "bytes": bytes,
                                "created_time": created_time,
                                "fullpath": fullpath
                            }
                        )
                    elif item.is_dir():
                        files.append(
                            {
                                "type": "dir",
                                "date": date,
                                "created_time": created_time,
                                "size": "-",
                                "name": name,
                                "fullpath": fullpath
                            }
                        )
        except Exception as e:
            logger.error(e)
            raise HTTPException(status_code=400, detail=str(e))

        return {"files": [x for x in files if is_path_trusted(x['fullpath'])]}

    @app.get(pre + "/image-thumbnail", dependencies=[Depends(get_token)])
    async def thumbnail(path: str, t: str, size: str = "256x256"):
        check_path_trust(path)
        if not temp_path:
            return
        # 生成缓存文件的路径
        hash_dir = hashlib.md5((path + t).encode("utf-8")).hexdigest()
        hash = hash_dir + size
        cache_dir = os.path.join(temp_path, "iib_cache", hash_dir)
        cache_path = os.path.join(cache_dir, f"{size}.webp")

        # 如果缓存文件存在，则直接返回该文件
        if os.path.exists(cache_path):
            return FileResponse(
                cache_path,
                media_type="image/webp",
                headers={"Cache-Control": "max-age=31536000", "ETag": hash},
            )

        # 如果缓存文件不存在，则生成缩略图并保存
        with Image.open(path) as img:
            w, h = size.split("x")
            img.thumbnail((int(w), int(h)))
            os.makedirs(cache_dir, exist_ok=True)
            img.save(cache_path, "webp")

        # 返回缓存文件
        return FileResponse(
            cache_path,
            media_type="image/webp",
            headers={"Cache-Control": "max-age=31536000", "ETag": hash},
        )


    @app.get(pre + "/file", dependencies=[Depends(get_token)])
    async def get_file(path: str, t: str, disposition: Optional[str] = None):
        filename = path
        import mimetypes
        check_path_trust(path)
        if not os.path.exists(filename):
            raise HTTPException(status_code=404)
        if not os.path.isfile(filename):
            raise HTTPException(status_code=400, detail=f"{filename} is not a file")
        # 根据文件后缀名获取媒体类型
        media_type, _ = mimetypes.guess_type(filename)
        headers = {}
        if disposition:
            headers["Content-Disposition"] = f'attachment; filename="{disposition}"'
        if is_path_under_parents(filename) and is_valid_image_path(filename):  # 认为永远不变,不要协商缓存了试试
            headers[
                "Cache-Control"
            ] = "public, max-age=31536000"  # 针对同样名字文件但实际上不同内容的文件要求必须传入创建时间来避免浏览器缓存
            headers["Expires"] = (datetime.now() + timedelta(days=365)).strftime(
                "%a, %d %b %Y %H:%M:%S GMT"
            )

        return FileResponse(
            filename,
            media_type=media_type,
            headers=headers,
        )

    @app.post(pre + "/send_img_path", dependencies=[Depends(get_token)])
    async def api_set_send_img_path(path: str):
        send_img_path["value"] = path

    # 等待图片信息生成完成
    @app.get(pre + "/gen_info_completed", dependencies=[Depends(get_token)])
    async def api_set_send_img_path():
        for _ in range(80):  # 等待8s
            if send_img_path["value"] == "":  # 等待setup里面生成完成
                return True
            v = send_img_path["value"]
            logger.info("gen_info_completed %s %s", _, v)
            await asyncio.sleep(0.1)
        return send_img_path["value"] == ""

    @app.get(pre + "/image_geninfo", dependencies=[Depends(get_token)])
    async def image_geninfo(path: str):
        with Image.open(path) as img:
            return read_info_from_image(img, path)

    class CheckPathExistsReq(BaseModel):
        paths: List[str]

    @app.post(pre + "/check_path_exists", dependencies=[Depends(get_token)])
    async def check_path_exists(req: CheckPathExistsReq):
        res = {}
        for path in req.paths:
            res[path] = os.path.exists(path)
        return res

    @app.get(pre)
    def index_bd():
        return FileResponse(index_html_path)

    class OpenFolderReq(BaseModel):
        path: str

    @app.post(pre + "/open_folder", dependencies=[Depends(get_token)])
    def open_folder_using_explore(req: OpenFolderReq):
        if not is_path_trusted(req.path):
            raise HTTPException(status_code=403)
        open_folder(*os.path.split(req.path))

    db_pre = pre + "/db"

    @app.get(db_pre + "/basic_info", dependencies=[Depends(get_token)])
    async def get_db_basic_info():
        conn = DataBase.get_conn()
        img_count = DbImg.count(conn)
        tags = Tag.get_all(conn)
        expired_dirs = Floder.get_expired_dirs(conn)
        return {
            "img_count": img_count,
            "tags": tags,
            "expired": len(expired_dirs) != 0,
            "expired_dirs": expired_dirs,
        }

    @app.get(db_pre + "/expired_dirs", dependencies=[Depends(get_token)])
    async def get_db_expired():
        conn = DataBase.get_conn()
        expired_dirs = Floder.get_expired_dirs(conn)
        return {
            "expired": len(expired_dirs) != 0,
            "expired_dirs": expired_dirs,
        }


    @app.post(db_pre + "/update_image_data", dependencies=[Depends(get_token)])
    async def update_image_db_data():
        try:
            DataBase._initing = True
            conn = DataBase.get_conn()
            img_count = DbImg.count(conn)
            update_extra_paths(conn)
            dirs = (
                img_search_dirs if img_count == 0 else Floder.get_expired_dirs(conn)
            ) + mem["EXTRA_PATHS"]
            update_image_data(dirs)
        finally:
            DataBase._initing = False

    class MatchImagesByTagsReq(BaseModel):
        and_tags: List[int]
        or_tags: List[int]
        not_tags: List[int]

    @app.post(db_pre + "/match_images_by_tags", dependencies=[Depends(get_token)])
    async def match_image_by_tags(req: MatchImagesByTagsReq):
        conn = DataBase.get_conn()
        return [
            x.to_file_info()
            for x in ImageTag.get_images_by_tags(
                conn, {"and": req.and_tags, "or": req.or_tags, "not": req.not_tags}
            )
        ]

    @app.get(db_pre + "/img_selected_custom_tag", dependencies=[Depends(get_token)])
    async def get_img_selected_custom_tag(path: str):
        path = os.path.normpath(path)
        if not is_valid_image_path(path):
            return []
        conn = DataBase.get_conn()
        update_extra_paths(conn)
        if not is_path_under_parents(path):
            return []
        img = DbImg.get(conn, path)
        if not img:
            if DbImg.count(conn) == 0:
                return []
            update_image_data([os.path.dirname(path)])
            img = DbImg.get(conn, path)
        assert img
        # tags = Tag.get_all_custom_tag()
        return ImageTag.get_tags_for_image(conn, img.id, type="custom")

    class ToggleCustomTagToImgReq(BaseModel):
        img_path: str
        tag_id: int

    @app.post(db_pre + "/toggle_custom_tag_to_img", dependencies=[Depends(get_token)])
    async def toggle_custom_tag_to_img(req: ToggleCustomTagToImgReq):
        conn = DataBase.get_conn()
        path = os.path.normpath(req.img_path)
        update_extra_paths(conn)
        if not is_path_under_parents(path):
            raise HTTPException(
                400,
                "当前文件不在搜索路径内，你可以将它添加到扫描路径再尝试。在右上角的\"更多\"里面"
                if locale == "zh"
                else "The current file is not within the scan path. You can add it to the scan path and try again. In the top right corner, click on \"More\".",
            )
        img = DbImg.get(conn, path)
        if not img:
            raise HTTPException(
                400,
                "你需要先通过图像搜索页生成索引"
                if locale == "zh"
                else "You need to generate an index through the image search page first.",
            )
        tags = ImageTag.get_tags_for_image(
            conn=conn, image_id=img.id, type="custom", tag_id=req.tag_id
        )
        is_remove = len(tags)
        if is_remove:
            ImageTag.remove(conn, img.id, tags[0].id)
        else:
            ImageTag(img.id, req.tag_id).save(conn)
        conn.commit()
        return {"is_remove": is_remove}

    class AddCustomTagReq(BaseModel):
        tag_name: str

    @app.post(db_pre + "/add_custom_tag", dependencies=[Depends(get_token)])
    async def add_custom_tag(req: AddCustomTagReq):
        conn = DataBase.get_conn()
        tag = Tag.get_or_create(conn, name=req.tag_name, type="custom")
        conn.commit()
        return tag

    class RemoveCustomTagReq(BaseModel):
        tag_id: str

    @app.post(db_pre + "/remove_custom_tag", dependencies=[Depends(get_token)])
    async def remove_custom_tag(req: RemoveCustomTagReq):
        conn = DataBase.get_conn()
        ImageTag.remove(conn, tag_id=req.tag_id)
        Tag.remove(conn, req.tag_id)

    class RemoveCustomTagFromReq(BaseModel):
        img_id: int
        tag_id: str

    @app.post(db_pre + "/remove_custom_tag_from_img", dependencies=[Depends(get_token)])
    async def remove_custom_tag_from_img(req: RemoveCustomTagFromReq):
        conn = DataBase.get_conn()
        ImageTag.remove(conn, image_id=req.img_id, tag_id=req.tag_id)

    @app.get(db_pre + "/search_by_substr", dependencies=[Depends(get_token)])
    async def search_by_substr(substr: str):
        conn = DataBase.get_conn()
        imgs = DbImg.find_by_substring(conn=conn, substring=substr)
        return [x.to_file_info() for x in imgs]

    class ScannedPathModel(BaseModel):
        path: str

    @app.post(
        f"{db_pre}/scanned_paths", status_code=201, dependencies=[Depends(get_token)]
    )
    async def create_scanned_path(scanned_path: ScannedPathModel):
        conn = DataBase.get_conn()
        path = ExtraPath(scanned_path.path)
        try:
            path.save(conn)
        finally:
            conn.commit()

    @app.get(
        f"{db_pre}/scanned_paths",
        response_model=List[ScannedPathModel],
        dependencies=[Depends(get_token)],
    )
    async def read_scanned_paths():
        conn = DataBase.get_conn()
        paths = ExtraPath.get_extra_paths(conn, "scanned")
        return [{"path": path.path} for path in paths]

    @app.delete(f"{db_pre}/scanned_paths", dependencies=[Depends(get_token)])
    async def delete_scanned_path(scanned_path: ScannedPathModel):
        conn = DataBase.get_conn()
        ExtraPath.remove(conn, scanned_path.path)
