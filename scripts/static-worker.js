const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    if (response.status === 404 && !url.pathname.split("/").at(-1)?.includes(".")) {
      const fallback = new URL(url);
      fallback.pathname =
        url.pathname === "/"
          ? "/index.html"
          : `${url.pathname.replace(/\/$/, "")}.html`;
      response = await env.ASSETS.fetch(new Request(fallback, request));
    }

    return response;
  },
};

export default worker;
