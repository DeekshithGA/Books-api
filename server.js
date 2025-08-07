require('dotenv').config(); // Load .env variables
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let books = [
  {
    id: 1,
    title: '1984',
    author: 'George Orwell',
    createdAt: new Date(),
    isFavorite: false,
    status: 'unread'
  },
  {
    id: 2,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    createdAt: new Date(),
    isFavorite: true,
    status: 'completed'
  }
];

// GET all books with optional filters, sort, pagination
app.get('/books', (req, res) => {
  let result = [...books];
  const { sortBy, page, limit, favorite, status } = req.query;

  if (favorite === 'true') {
    result = result.filter(b => b.isFavorite);
  }

  if (status) {
    result = result.filter(b => b.status === status.toLowerCase());
  }

  if (sortBy === 'title' || sortBy === 'author') {
    result.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || result.length;
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const paginated = result.slice(start, end);

  res.json({
    total: result.length,
    page: pageNum,
    limit: limitNum,
    data: paginated
  });
});

// GET a single book
app.get('/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  res.json(book);
});

// Search books by title or author
app.get('/books/search', (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query required.' });

  const result = books.filter(
    b =>
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase())
  );
  res.json(result);
});

// Get a random book recommendation
app.get('/books/recommend', (req, res) => {
  if (books.length === 0) return res.status(404).json({ error: 'No books available.' });
  const randomBook = books[Math.floor(Math.random() * books.length)];
  res.json(randomBook);
});

// Get book stats
app.get('/books/stats', (req, res) => {
  const total = books.length;
  const favorites = books.filter(b => b.isFavorite).length;
  const completed = books.filter(b => b.status === 'completed').length;
  const unread = books.filter(b => b.status === 'unread').length;
  const reading = books.filter(b => b.status === 'reading').length;

  res.json({ total, favorites, completed, reading, unread });
});

// POST a new book
app.post('/books', (req, res) => {
  const { title, author, status = 'unread', isFavorite = false } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Title and author required.' });

  const newBook = {
    id: books.length ? books[books.length - 1].id + 1 : 1,
    title,
    author,
    createdAt: new Date(),
    isFavorite,
    status
  };
  books.push(newBook);
  res.status(201).json(newBook);
});

// PUT update entire book
app.put('/books/:id', (req, res) => {
  const { title, author, isFavorite, status } = req.body;
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found.' });

  if (title) book.title = title;
  if (author) book.author = author;
  if (typeof isFavorite === 'boolean') book.isFavorite = isFavorite;
  if (status) book.status = status;

  res.json(book);
});

// PATCH: Toggle favorite
app.patch('/books/:id/favorite', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found.' });

  book.isFavorite = !book.isFavorite;
  res.json({ message: 'Favorite status toggled.', book });
});

// PATCH: Update reading status
app.patch('/books/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['unread', 'reading', 'completed'];

  if (!validStatuses.includes(status))
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });

  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found.' });

  book.status = status;
  res.json({ message: 'Status updated.', book });
});

// DELETE a book
app.delete('/books/:id', (req, res) => {
  const index = books.findIndex(b => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Book not found.' });

  const deleted = books.splice(index, 1);
  res.json(deleted[0]);
});

// DELETE all books
app.delete('/books/reset', (req, res) => {
  books = [];
  res.json({ message: 'Book list cleared.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`📚 Book API running at http://localhost:${PORT}`);
});
