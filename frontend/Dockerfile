# Etapă Builder: folosește Node.js Alpine pentru a construi aplicația React.
# • Rol: Instalează dependențele și compilează codul sursă.
# • Motiv: Izolează build-ul într-un container ușor și reproducibil.
# • Alternative: Folosirea unei imagini Debian-based sau Yarn în loc de npm.
FROM node:22-alpine AS builder

# Setarea directorului de lucru
# • Rol: Stabilește rădăcina unde vom copia și rula comenzi în container.
WORKDIR /app

# Copiere manifest și instalare dependențe
# • Rol: Asigură că pachetele npm sunt instalate înainte de copierea întregului cod.
# • Motiv: Profită de layer caching pentru a nu reinstala dependențe la fiecare build.
COPY package.json package-lock.json ./
RUN npm install

# Copierea întregului cod sursă
# • Rol: Pune toate fișierele proiectului în container pentru build.
COPY . .

# Opțiune Node: compatibilitate OpenSSL legacy
# • Rol: Previi erori de build pe unele versiuni Node care cer opțiuni OpenSSL.
# • Alternative: Upgradarea dependențelor care folosesc API-uri noi OpenSSL.
ENV NODE_OPTIONS=--openssl-legacy-provider

# Build React
# • Rol: Rulează scriptul de build pentru a genera fișiere statice în /app/build.
RUN npm run build

# Etapă de Servire: folosește Nginx Alpine pentru a servi fișierele build-uite.
# • Rol: Oferă un server HTTP performant și ușor de configurat pentru fișiere statice.
# • Alternative: Servire cu un server Express, Caddy sau Apache.
FROM nginx:alpine

# Copiere fișiere statice în folderul default Nginx
# • Rol: Pune rezultatul build-ului React în locația servită de Nginx.
COPY --from=builder /app/build /usr/share/nginx/html

# Configurare Nginx
# • Rol: Suprascrie configurația default pentru routing și cache.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expunerea portului 80
# • Rol: Declarează portul pe care Nginx ascultă pentru trafic HTTP.
EXPOSE 80

# Comanda default
# • Rol: Pornește Nginx în prim-plan pentru a menține containerul activ.
CMD ["nginx", "-g", "daemon off;"]