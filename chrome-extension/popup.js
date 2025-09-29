const API_URL = 'http://127.0.0.1:8000';

const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const categorySelect = document.getElementById('category');
const form = document.getElementById('add-site-form');
const messageDiv = document.getElementById('message');

// 1. ポップアップが開かれたら、現在アクティブなタブの情報を取得してフォームにセットする
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  const currentTab = tabs[0];
  if (currentTab) {
    titleInput.value = currentTab.title;
    urlInput.value = currentTab.url;
  }
});

// 2. FastAPIサーバーからカテゴリ一覧を取得して、セレクトボックスに表示する
fetch(`${API_URL}/api/categories`)
  .then(response => response.json())
  .then(categories => {
    categorySelect.innerHTML = '<option value="" disabled selected>カテゴリを選択</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  })
  .catch(error => {
    messageDiv.textContent = 'カテゴリの読込に失敗';
    console.error('Error fetching categories:', error);
  });

// 3. 「追加」ボタンが押されたら、FastAPIにデータを送信する
form.addEventListener('submit', function(event) {
  event.preventDefault();

  const siteData = {
    title: titleInput.value,
    url: urlInput.value,
    category_id: parseInt(categorySelect.value, 10)
  };

  fetch(`${API_URL}/api/sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(siteData),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    messageDiv.textContent = '追加しました！';
    messageDiv.style.color = 'green';
    setTimeout(() => window.close(), 1200); // 1.2秒後にポップアップを閉じる
  })
  .catch(error => {
    messageDiv.textContent = '追加に失敗しました。';
    messageDiv.style.color = 'red';
    console.error('Error adding site:', error);
  });
});