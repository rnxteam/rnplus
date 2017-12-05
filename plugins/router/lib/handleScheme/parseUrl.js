const CHARACTER_PROTOCOL = '://';
const CHARACTER_SEARCH = '?';

function parseUrl(url) {
  let protocol;
  let urlWithoutProtocol;
  let path;
  let search;
  let searchData;

  if (url.includes(CHARACTER_PROTOCOL)) {
    const arraySplitByProtocol = url.split(CHARACTER_PROTOCOL);
    protocol = arraySplitByProtocol[0];
    urlWithoutProtocol = arraySplitByProtocol[1];
  } else {
    urlWithoutProtocol = url;
  }

  if (urlWithoutProtocol.includes(CHARACTER_SEARCH)) {
    const arraySplitBySearch = urlWithoutProtocol.split(CHARACTER_SEARCH);
    path = arraySplitBySearch[0];
    search = arraySplitBySearch[1];
    searchData = getDataFromSearch(search);
  } else {
    path = urlWithoutProtocol;
  }

  return {
    url,
    protocol,
    urlWithoutProtocol,
    path,
    search,
    searchData,
  };
}

/**
 * 从 search 上获取数据
 * 'a=b&c=d' => { a: 'b', c: 'd' }
 */
function getDataFromSearch(search) {
  let data;

  if (search) {
    data = {};
    const pairs = search.split('&');

    pairs.forEach((pair) => {
      const pairArr = pair.split('=');
      data[pairArr[0]] = pairArr[1];
    });
  }

  return data;
}

export default parseUrl;
