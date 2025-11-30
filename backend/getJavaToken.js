const { Authflow } = require('prismarine-auth');

const userIdentifier = 'MainAccount'; // or whatever you used as the identifier
const cacheDir = './backend/auth_cache/2'; // path to your cache directory

const flow = new Authflow(userIdentifier, cacheDir);

flow.getMinecraftJavaToken({ fetchProfile: true }).then(token => {
  console.log('Minecraft Java Token:', token);
});