const atom = {
  cv: 'POOKE1.0.01_Web',
  lca_lang: 'zh_CN',
  time_zone: 'Asia / Shanghai',
};
const query2Search = (query: {[keyName: string]: any} = {}) => {
  const keys = Object.keys(query);
  const urlItems: Array<string> = [];
  keys.forEach(key => urlItems.push(`${key}=${query[key]}`));
  return urlItems.join('&');
};
const serviceDoMain = 'https://testservice.pooke.com';

interface Res {
  code: number;
  data: {[keyName: string]: any};
  message: string;
}
export const get = (url: string) => {
  return async (query = {}): Promise<Res> => {
    const newUrl =
      serviceDoMain + url + '?' + query2Search({...atom, ...query});
    let response = await fetch(newUrl, {
      method: 'GET',
    });
    let responseJson = await response.json();
    return responseJson;
  };
};

export const post = (url: string) => {
  return async (body = {}): Promise<Res> => {
    const newUrl = serviceDoMain + url + '?' + query2Search({...atom});
    let response = await fetch(newUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    let responseJson = await response.json();
    return responseJson;
  };
};
