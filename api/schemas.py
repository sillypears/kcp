from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class KeycapBase(BaseModel):
    maker_id: Optional[int] = None
    collab_id: Optional[int] = None
    box_id: Optional[int] = None
    cell_x: Optional[int] = None
    cell_y: Optional[int] = None
    sculpt: str
    sculpt_clean: Optional[str] = None
    colorway: Optional[str] = None
    date_won: Optional[datetime] = None
    date_received: Optional[datetime] = None
    date_sold: Optional[datetime] = None
    keep_forever: Optional[bool] = False


class KeycapCreate(KeycapBase):
    pass


class KeycapUpdate(BaseModel):
    maker_id: Optional[int] = None
    collab_id: Optional[int] = None
    box_id: Optional[int] = None
    cell_x: Optional[int] = None
    cell_y: Optional[int] = None
    sculpt: Optional[str] = None
    sculpt_clean: Optional[str] = None
    colorway: Optional[str] = None
    date_won: Optional[datetime] = None
    date_received: Optional[datetime] = None
    date_sold: Optional[datetime] = None
    keep_forever: Optional[bool] = None


class KeycapResponse(KeycapBase):
    id: int
    maker_name: Optional[str] = None
    collab_name: Optional[str] = None
    label: Optional[str] = None
    unique_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MoveKeycap(BaseModel):
    keycap_id: int
    box_id: Optional[int] = None
    cell_x: Optional[int] = None
    cell_y: Optional[int] = None


class MakerBase(BaseModel):
    maker_name: str
    maker_name_clean: Optional[str] = None
    instagram: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    first_name: Optional[str] = None
    state_code: Optional[str] = None
    keycap_archivist_id: Optional[str] = None
    keycap_archivist_name: Optional[str] = None

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
    allow_duplicates: bool = False


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
