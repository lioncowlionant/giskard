import logging
from pathlib import Path
import os
import random

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.api import deps
from app.core import files

router = APIRouter()

logger = logging.getLogger("files-api")
logger.setLevel(logging.INFO)


@router.post("/data/upload")
async def upload_data(
    projectId: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> schemas.Msg:

    if not (file.filename.endswith(".csv")
            or file.filename.endswith(".xls")
            or file.filename.endswith(".xlsx")):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only CSV, XLS and XLSX files allowed")

    project = crud.project.get(db, projectId)
    if (
        crud.user.is_superuser(current_user)
        or project.owner_id == current_user.id
        or current_user.user_id in [u.user_id for u in project.guest_list]
    ):
        try:
            compressed_file = files.compress_for_storage(file)
            files.save_dataset_file(db, compressed_file, project, current_user.id)
            return {"msg": "Successfully uploaded"}
        except Exception as e:
            logger.exception(f"Could not upload file to server: {e}")
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Could not upload file to server. Reason: [{type(e).__name__}]",
            )
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZEDHTTP, "Not enough Permissions")


@router.delete("/models/{id}")
def delete_model_files(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> schemas.Msg:
    model_file = crud.project_model.get(db, id)
    if crud.user.is_superuser(current_user) or model_file.owner_id == current_user.id:
        try:
            os.remove(Path(model_file.location))
            os.remove(Path(model_file.requirements_file_location))
            crud.project_model.remove(db, id=id)
            logging.info(f"Successfully deleted files of model #{id}")
            return {"msg": "Successfully deleted"}
        except IOError as e:
            logging.error(e)
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not delete: " + type(e).__name__
            )
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not enough permissions")


@router.delete("/datasets/{id}")
def delete_dataset_file(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> schemas.Msg:
    file_model = crud.dataset.get(db, id)
    if crud.user.is_superuser(current_user) or file_model.owner_id == current_user.id:
        try:
            os.remove(Path(file_model.location))
            crud.dataset.remove(db, id=id)
            logging.info(f"Successfully deleted dataset file #{id}")
            return {"msg": "Successfully deleted"}
        except IOError as e:
            logging.error(e)
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not delete: " + type(e).__name__
            )
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not enough permissions")


@router.get("/models/{id}")
def download_file(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    model_file = crud.project_model.get(db, id)
    return perform_return_file(db, current_user, model_file)


@router.get("/datasets/{id}")
def download_data_file(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    data_file = crud.dataset.get(db, id)
    return perform_return_file(db, current_user, data_file)


def perform_return_file(db: Session, user: models.User, file: models.ProjectFile):
    project = crud.project.get(db, file.project_id)
    if files.has_read_access(user, project, file):
        try:
            return FileResponse(file.location, media_type="blob")
        except IOError as e:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not get file: " + type(e).__name__
            )
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not enough permissions")


@router.get("/datasets/{id}/peak")
def peak_data_file(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    data_file = crud.dataset.get(db, id)
    project = crud.project.get(db, data_file.project_id)
    if files.has_read_access(current_user, project, data_file):
        try:
            df = files.read_dataset_file(data_file.location)
            return df.head().to_json(orient="table")
        except Exception as e:
            logger.exception(e)
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Data file cannot be read")
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not enough permissions")


@router.get("/datasets/{id}/row/random")
def get_data_by_row_random(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):  
    data_file = crud.dataset.get(db, id)
    project = crud.project.get(db, data_file.project_id)
    if files.has_read_access(current_user, project, data_file):
        try:
            df = files.read_dataset_file(data_file.location)
            randomRowId = random.randint(0, len(df.index))
            sub_df = df.iloc[randomRowId]
            sub_df_dict = {col_name: str(col_value) for col_name, col_value in sub_df.to_dict().items()}
            sub_df_dict['rowNb'] = randomRowId
            return sub_df_dict
        except Exception as e:
            logger.exception(e)
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Row data cannot be read")
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not enough permissions")


@router.get("/datasets/{id}/row/{rowId}")
def get_data_by_row(
    id: int,
    rowId: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    data_file = crud.dataset.get(db, id)
    project = crud.project.get(db, data_file.project_id)
    if files.has_read_access(current_user, project, data_file):
        try:  # TODO: change all later to avoid reloading DF at every request
            df = files.read_dataset_file(data_file.location)
        except Exception as e:
            logger.exception(e)
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Data file cannot be read")
        
        try:
            rowId %= len(df.index)  # to start again from 0 when exceeding length
            sub_df = df.iloc[rowId]
            sub_df_dict = {col_name: str(col_value) for col_name, col_value in sub_df.to_dict().items()}
            sub_df_dict['rowNb'] = rowId
            return sub_df_dict
        except Exception as e:
            logger.exception(e)
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Row data cannot be read")
    else:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not enough permissions")
