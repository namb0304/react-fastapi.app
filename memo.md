### データベースを起動
docker start my-postgres

### ドッカー内でのテーブル確認
docker exec -it my-postgres psql -U s2422051

### backendフォルダに移動
cd ~/my_projects/my-dashboard/backend

### FastAPIサーバー起動
uvicorn main:app --reload


### frontendフォルダに移動
cd ~/my_projects/my-dashboard/frontend

### Reactサーバー起動
npm run dev