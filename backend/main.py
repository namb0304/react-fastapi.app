import requests
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, relationship
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Optional
from urllib.parse import urlparse
from bs4 import BeautifulSoup

# --- 1. データベース接続設定 ---
DB_USER = "s2422051"
DB_PASSWORD = "mysecretpassword"
DB_HOST = "localhost"
DB_NAME = "s2422051"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. データベースのモデル定義 ---
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    display_order = Column(Integer, default=0)
    sites = relationship("Site", back_populates="category", cascade="all, delete-orphan", order_by="Site.display_order")

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String, index=True)
    favicon_url = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="sites")

# --- 3. Pydanticスキーマ定義 ---
class SiteBase(BaseModel):
    url: str
    title: Optional[str] = None

class SiteCreate(SiteBase):
    category_id: int

class SiteUpdate(BaseModel):
    title: str

class SiteResponse(SiteBase):
    id: int
    favicon_url: Optional[str] = None
    display_order: int
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    display_order: int
    sites: List[SiteResponse] = []
    class Config:
        from_attributes = True

class OrderUpdateRequest(BaseModel):
    id: int
    order: int

class MoveSiteRequest(BaseModel):
    site_id: int
    new_category_id: int

# --- 4. データベースのテーブル作成 ---
Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS設定 ---
origins = [ "http://localhost:5173" ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. APIエンドポイント ---
@app.get("/api/categories", response_model=List[CategoryResponse])
def read_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.display_order).all()

@app.post("/api/sites", response_model=SiteResponse)
def create_site(site: SiteCreate, db: Session = Depends(get_db)):
    title = site.title
    if not title:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'}
            page = requests.get(site.url, timeout=5, headers=headers)
            page.raise_for_status()
            soup = BeautifulSoup(page.content, "html.parser")
            title_tag = soup.find('title')
            title = title_tag.get_text(strip=True) if title_tag else "タイトル取得失敗"
        except requests.RequestException:
            title = "タイトル取得失敗"
    
    favicon_url = f"https://www.google.com/s2/favicons?domain={urlparse(site.url).netloc}&sz=32"
    
    max_order = db.query(Site).filter(Site.category_id == site.category_id).count()
    
    db_site = Site(title=title, url=site.url, category_id=site.category_id, favicon_url=favicon_url, display_order=max_order)
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    return db_site

@app.put("/api/sites/{site_id}", response_model=SiteResponse)
def update_site_title(site_id: int, site_update: SiteUpdate, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.id == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    db_site.title = site_update.title
    db.commit()
    db.refresh(db_site)
    return db_site

@app.post("/api/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    max_order = db.query(Category).count()
    db_category = Category(name=category.name, display_order=max_order)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.put("/api/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db_category.name = category.name
    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/api/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_category)
    db.commit()
    return

@app.delete("/api/sites/{site_id}", status_code=204)
def delete_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.id == site_id).first()
    if db_site is None:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(db_site)
    db.commit()
    return

@app.post("/api/update-order/categories")
def update_categories_order(order_updates: List[OrderUpdateRequest], db: Session = Depends(get_db)):
    for update in order_updates:
        db.query(Category).filter(Category.id == update.id).update({"display_order": update.order})
    db.commit()
    return {"message": "Categories order updated"}

@app.post("/api/update-order/sites")
def update_sites_order(order_updates: List[OrderUpdateRequest], db: Session = Depends(get_db)):
    for update in order_updates:
        db.query(Site).filter(Site.id == update.id).update({"display_order": update.order})
    db.commit()
    return {"message": "Sites order updated"}

@app.post("/api/move-site")
def move_site(move_request: MoveSiteRequest, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.id == move_request.site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    db_site.category_id = move_request.new_category_id
    db.commit()
    return {"message": "Site moved successfully"}
