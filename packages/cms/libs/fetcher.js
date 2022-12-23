export const fetcher = (...args) => fetch(...args).then((res) => res.json());

export const fetcherWithToken = (url, token) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(responseHandler)
    .then((json) => json.data);

export const post = (url, data) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .then(responseHandler)
    .then((json) => json.data);

function responseHandler(res) {
  if (res.ok) {
    return res.json();
  } else {
    console.log(res);
    const error = new Error(res.statusText);
    error.response = { status: res.status, statusText: res.statusText };
    throw error;
  }
}