process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async function () {
    let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
          '1234567890',
          'https://amazon.com/randombook',
          'Jolkien Rolkien',
          'English',
          456,
          'Penguin',
          'Some Book', 1956)
        RETURNING isbn`);

    book_isbn = result.rows[0].isbn
});

afterEach(async function () {
    await db.query('DELETE FROM books')
});

afterAll(async function () {
    await db.end()
});

describe('Post /books', function () {
    test('Create New Book', async function () {
        const response = await request(app).post('/books').send({
            isbn: '987654321',
            amazon_url: 'https://amazon.com/anotherbook',
            author: 'Flergen',
            language: 'Swedish',
            pages: 420,
            publisher: 'Fake Pub',
            title: 'Swedish Book',
            year: 2019
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty('isbn')
    })
    test('Fails creating book without title', async function () {
        const response = await request(app).post('/books').send({

            isbn: '201598521',
            amazon_url: 'https://amazon.com/anotherbook2',
            author: 'Blergen',
            language: 'Swedish',
            pages: 420,
            publisher: 'Fake Pub',
            year: 2018

        });
        expect(response.statusCode).toBe(400);
    });
});

describe('GET /books', function () {
    test('Get list of 1 book', async function () {
        const response = await request(app).get('/books');
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('isbn');
        expect(books[0]).toHaveProperty('amazon_url');
    })
})

describe('GET /books/:isbn', function () {
    test('Get 1 book', async function () {
        const response = await request(app).get(`/books/${book_isbn}`);
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.isbn).toBe(book_isbn);
    })

    test('get 404 if book is not found', async function () {
        const response = await request(app).get('/books/99999');
        expect(response.statusCode).toBe(404);
    })
})

describe('PUT /books/:id', function () {
    test('Update a single book', async function () {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            isbn: book_isbn,
            amazon_url: 'www.fakesite.com',
            author: 'test',
            language: 'Elvish',
            pages: 888,
            publisher: 'Fake Pub',
            title: 'New Swedish Book',
            year: 2019
        })
        console.log('line 100', response);
        console.log('line 101', response.body);
        console.log('line 102', response.body.book);
        console.log('line 103', response.body.book.isbn);

        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.author).toBe('test');
        expect(response.body.book.amazon_url).toBe('www.fakesite.com');

    })

    test('Prevent update with incorrect data', async function () {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url: 'www.fakesite.com',
            author123: 'test',
            language123: 'Elvish',
            pages123: 888,
            publisher123: 'Fake Pub',
            title: 'Swedish Book',
            year: 2019
        })
        expect(response.statusCode).toBe(400)
    })

    // test('get 404 if book is not found', async function () {
    //     const response = await request(app).put('/books/99999').send({
    //         amazon_url: 'www.fakesite.com',
    //         author: 'test',
    //         language: 'Elvish',
    //         pages: 888,
    //         publisher: 'Fake Pub',
    //         title: 'Swedish Book',
    //         year: 2019
    //     })
    //     expect(response.statusCode).toBe(404)
    // })

    test("Responds 404 if can't find book in question", async function () {
        await request(app).delete(`/books/${book_isbn}`);
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(404);
    });
})

describe('DELETE /books/:id', function () {
    test('Deletes a single book', async function () {
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.body).toEqual({ message: 'Book deleted' })
    })
})