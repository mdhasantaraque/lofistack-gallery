export const site = {
  name: "LofiStack Gallery",
  author: "Md. Hasan Taraque",
  repoUrl: "https://github.com/mdhasantaraque/lofistack-gallery",
  branch: "main",
};

export const repoFileUrl = (file: string) => `${site.repoUrl}/blob/${site.branch}/${file}`;
