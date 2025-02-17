import datetime
from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import declared_attr

from app.db.base_class import Base


class ProjectFile(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, index=True, nullable=False)
    location = Column(String, nullable=False)
    created_on = Column(DateTime(timezone=True), default=datetime.datetime.now)
    @declared_attr
    def owner_id(cls):
        return Column(Integer, ForeignKey("user.id"), nullable=False)
    @declared_attr
    def project_id(cls):
        return Column(Integer, ForeignKey("projects.id"), nullable=False)


class Dataset(ProjectFile):
    __tablename__ = "datasets"


class ProjectModel(ProjectFile):
    __tablename__ = "project_models"

    python_version = Column(String, nullable=False)
    requirements_file_location = Column(String, nullable=False)
