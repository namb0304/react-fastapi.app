from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, relationship
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Optional
from urllib.parse import urlparse # URLからドメインを抽出するためにインポート

# --- 1. データベース接続設定 (PostgreSQL用) ---
DB_USER = "s2422051"
DB_PASSWORD = "mysecretpassword"
DB_HOST = "localhost"
DB_NAME = "s2422051"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. データベースのモデル定義 (テーブル設計) ---
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    sites = relationship("Site", back_populates="category", cascade="all, delete-orphan")

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String, index=True)
    favicon_url = Column(String, nullable=True) # FaviconのURLを保存する列を追加
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="sites")

# --- 3. Pydanticスキーマ定義 (APIのデータ型) ---
class SiteBase(BaseModel):
    title: str
    url: str

class SiteCreate(SiteBase):
    category_id: int

class SiteResponse(SiteBase):
    id: int
    favicon_url: Optional[str] = None # レスポンスにもfavicon_urlを追加
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
    sites: List[SiteResponse] = []
    class Config:
        from_attributes = True

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

# --- DBセッション取得 ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. APIエンドポイント ---

# カテゴリ作成
@app.post("/api/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# 全カテゴリ取得
@app.get("/api/categories", response_model=List[CategoryResponse])
def read_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

# カテゴリ更新
@app.put("/api/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db_category.name = category.name
    db.commit()
    db.refresh(db_category)
    return db_category

# カテゴリ削除
@app.delete("/api/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_category)
    db.commit()
    return

# サイト作成
@app.post("/api/sites", response_model=SiteResponse)
def create_site(site: SiteCreate, db: Session = Depends(get_db)):
    # FaviconのURLを自動生成
    try:
        domain = urlparse(site.url).netloc
        # GoogleのFaviconサービスを利用
        favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=32"
    except Exception:
        favicon_url = None # URLの解析に失敗した場合はNone

    db_site = Site(**site.dict(), favicon_url=favicon_url)
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    return db_site

# サイト削除
@app.delete("/api/sites/{site_id}", status_code=204)
def delete_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.id == site_id).first()
    if db_site is None:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(db_site)
    db.commit()
    return
