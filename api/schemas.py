from pydantic import BaseModel, ConfigDict
from typing import Optional


class KeycapBase(BaseModel):
    maker_id: Optional[int] = None
    collab_id: Optional[int] = None
    box_id: Optional[int] = None
    cell_x: Optional[int] = None
    cell_y: Optional[int] = None
    sculpt: str
    colorway: Optional[str] = None


class KeycapCreate(KeycapBase):
    pass


class KeycapUpdate(BaseModel):
    maker_id: Optional[int] = None
    collab_id: Optional[int] = None
    box_id: Optional[int] = None
    cell_x: Optional[int] = None
    cell_y: Optional[int] = None
    sculpt: Optional[str] = None
    colorway: Optional[str] = None


class KeycapResponse(KeycapBase):
    id: int
    maker_name: Optional[str] = None
    collab_name: Optional[str] = None
    label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MoveKeycap(BaseModel):
    keycap_id: int
    box_id: Optional[int] = None
    cell_x: Optional[int] = None
    cell_y: Optional[int] = None


class MakerBase(BaseModel):
    maker_name: str
    maker_name_clean: Optional[str] = None


class MakerCreate(MakerBase):
    pass


class MakerResponse(MakerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BoxBase(BaseModel):
    label: str
    name: Optional[str] = None
    maker_name: Optional[str] = None
    capacity: Optional[int] = None
    height: Optional[int] = None
    width: Optional[int] = None
    dedicated: bool = False
    allow_add: bool = True


class BoxCreate(BoxBase):
    pass


class BoxUpdate(BaseModel):
    name: Optional[str] = None
    maker_name: Optional[str] = None
    capacity: Optional[int] = None
    height: Optional[int] = None
    width: Optional[int] = None
    dedicated: Optional[bool] = None
    allow_add: Optional[bool] = None


class BoxResponse(BoxBase):
    id: int
    allow_duplicates: bool = False

    model_config = ConfigDict(from_attributes=True)
