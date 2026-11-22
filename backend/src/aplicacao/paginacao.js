function lerPaginacao(query) {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  return { page, limit, offset: (page - 1) * limit };
}

module.exports = lerPaginacao;
