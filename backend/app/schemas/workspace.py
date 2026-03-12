from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    description: str = ""


class WorkspaceRead(BaseModel):
    id: int
    name: str
    description: str

    model_config = {"from_attributes": True}


class PaperCreate(BaseModel):
    title: str
    authors: str = ""
    abstract: str = ""
    source: str = "arxiv"
    url: str = ""
    published_at: str = ""


class PaperRead(PaperCreate):
    id: int

    model_config = {"from_attributes": True}


class SearchResult(BaseModel):
    title: str
    authors: str
    abstract: str
    source: str
    url: str
    published_at: str
