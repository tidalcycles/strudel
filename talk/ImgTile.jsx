function ImgTile({ src, width, height }) {
  return (
    <div style={{ background: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', width, height }} />
  );
}
export default ImgTile;
