const axios = require('axios');

function getListFromResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getItemFromResponse(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload || {};
}

function getApiUrl() {
  return process.env.API_URL || 'http://localhost:8080';
}

function getCookieValue(req, name) {
  const cookies = req.headers.cookie || '';

  const cookie = cookies
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith(`${name}=`));

  if (!cookie) return '';

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function getAuthConfig(req, config = {}) {
  const token =
    req.session?.token ||
    getCookieValue(req, 'token');

  if (!token) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
  };
}

function getBookId(book) {
  return book.id ?? book._id ?? book.bookId;
}

function getPlaylistPayload(body) {
  return {
    name: body.name,
    description: body.description,
    image: body.image,
    isFeatured:
      body.isFeatured === 'on' ||
      body.isFeatured === 'true' ||
      body.isFeatured === true,
    bookIds: normalizeBookIds(body.bookIds)
  };
}

function normalizeBookIds(bookIds) {
  if (!bookIds) {
    return [];
  }

  if (Array.isArray(bookIds)) {
    return bookIds
      .map((value) => Number(value))
      .filter((id) => !Number.isNaN(id));
  }

  if (typeof bookIds === 'string') {
    return bookIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((id) => !Number.isNaN(id));
  }

  return [];
}

async function getBooks(req) {
  const response = await axios.get(
    `${getApiUrl()}/books`,
    getAuthConfig(req, {
      params: {
        page: 0,
        size: 1000
      }
    })
  );

  return getListFromResponse(response.data);
}

class PlaylistController {

  async index(req, res) {
    const {
      page = 0,
      size = 10,
      search = ''
    } = req.query;

    try {
      const response = await axios.get(
        `${getApiUrl()}/playlists`,
        getAuthConfig(req, {
          params: {
            page,
            size,
            search
          }
        })
      );

      const result = response.data || {};
      const playlists = getListFromResponse(result);
      const currentPage = Number(page);
      const pageSize = Number(size);

      const pagination = {
        page: currentPage,
        size: pageSize,
        totalPages:
          result.totalPages ||
          currentPage + (playlists.length === pageSize ? 2 : 1),
        totalElements:
          result.totalElements ||
          playlists.length,
        hasNext:
          result.hasNext ??
          playlists.length === pageSize,
        hasPrevious:
          result.hasPrevious ??
          currentPage > 0
      };

      return res.render('playlists/index', {
        title: 'Quản lý playlists',
        playlists,
        pagination,
        filters: {
          page,
          size,
          search
        }
      });
    } catch (error) {
      console.error(
        'Get playlists error:',
        error.response?.data ||
        error.message
      );

      return res.render('playlists/index', {
        title: 'Quản lý playlists',
        playlists: [],
        pagination: {
          page: 0,
          size: Number(size),
          totalPages: 1,
          totalElements: 0,
          hasNext: false,
          hasPrevious: false
        },
        filters: {
          page,
          size,
          search
        },
        error: 'Không tải được danh sách playlists'
      });
    }
  }

  async create(req, res) {
    try {
      const books = await getBooks(req);

      return res.render('playlists/create', {
        title: 'Thêm playlist',
        playlist: {},
        books
      });
    } catch (error) {
      console.error(
        'Get books for playlist create error:',
        error.response?.data ||
        error.message
      );

      return res.render('playlists/create', {
        title: 'Thêm playlist',
        playlist: {},
        books: []
      });
    }
  }

  async store(req, res) {
    try {
      await axios.post(
        `${getApiUrl()}/playlists`,
        getPlaylistPayload(req.body),
        getAuthConfig(req)
      );

      return res.redirect('/playlists');
    } catch (error) {
      console.error(
        'Create playlist error:',
        error.response?.data ||
        error.message
      );

      const books = await getBooks(req).catch(() => []);

      return res.render('playlists/create', {
        title: 'Thêm playlist',
        playlist: req.body,
        books,
        error: 'Không tạo được playlist'
      });
    }
  }

  async show(req, res) {
    const { id } = req.params;

    try {
      const response = await axios.get(
        `${getApiUrl()}/playlists/${id}`,
        getAuthConfig(req)
      );

      return res.json(
        getItemFromResponse(response.data)
      );
    } catch (error) {
      console.error(
        'Get playlist detail error:',
        error.response?.data ||
        error.message
      );

      return res.status(
        error.response?.status || 500
      ).json({
        message: 'Không tải được playlist'
      });
    }
  }

  async edit(req, res) {
    const { id } = req.params;

    try {
      const [playlistResponse, books] = await Promise.all([
        axios.get(
          `${getApiUrl()}/playlists/${id}`,
          getAuthConfig(req)
        ),
        getBooks(req)
      ]);

      const playlist = getItemFromResponse(playlistResponse.data);

      return res.render('playlists/edit', {
        title: 'Chỉnh sửa playlist',
        playlist,
        books
      });
    } catch (error) {
      console.error(
        'Get edit playlist form error:',
        error.response?.data ||
        error.message
      );

      return res.redirect('/playlists');
    }
  }

  async update(req, res) {
    const { id } = req.params;

    try {
      await axios.put(
        `${getApiUrl()}/playlists/${id}`,
        getPlaylistPayload(req.body),
        getAuthConfig(req)
      );

      return res.redirect('/playlists');
    } catch (error) {
      console.error(
        'Update playlist error:',
        error.response?.data ||
        error.message
      );

      const books = await getBooks(req).catch(() => []);

      return res.render('playlists/edit', {
        title: 'Chỉnh sửa playlist',
        playlist: {
          ...req.body,
          id
        },
        books,
        error: 'Không cập nhật được playlist'
      });
    }
  }

  async destroy(req, res) {
    const { id } = req.params;

    try {
      await axios.delete(
        `${getApiUrl()}/playlists/${id}`,
        getAuthConfig(req)
      );

      return res.redirect('/playlists');
    } catch (error) {
      console.error(
        'Delete playlist error:',
        error.response?.data ||
        error.message
      );

      return res.redirect('/playlists');
    }
  }
}

module.exports = new PlaylistController();