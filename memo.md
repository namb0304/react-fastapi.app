### データベースを起動
docker start my-postgres

### ドッカーコマンドでデータベース接続
docker exec -it my-postgres psql -U s2422051

### データベース再構築流れ
docker stop my-postgres
docker rm my-postgres
docker run --name my-postgres -e POSTGRES_USER=s2422051 -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=s2422051 -p 5432:5432 -d postgres
93e915f730c42910d9fc068ac6cc52ae163c3d803118009aa2a1b72bc49b980c


### backendフォルダに移動
cd ~/my_projects/my-dashboard/backend

### FastAPIサーバー起動
uvicorn main:app --reload


### frontendフォルダに移動
cd ~/my_projects/my-dashboard/frontend

### Reactサーバー起動
npm run dev