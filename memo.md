### データベースを起動
docker start my-postgres


### backendフォルダに移動
cd ~/my_projects/my-dashboard/backend

### FastAPIサーバー起動
uvicorn main:app --reload


### frontendフォルダに移動
cd ~/my_projects/my-dashboard/frontend

### Reactサーバー起動
npm run dev