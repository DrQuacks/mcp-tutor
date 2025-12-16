export default function FlexboxBasics() {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'300px',flexDirection:'column',gap:'20px'}}>
      <div style={{padding:'20px',background:'#e0e0e0'}}>Box 1</div>
      <div style={{padding:'20px',background:'#e0e0e0'}}>Box 2</div>
      <div style={{padding:'20px',background:'#e0e0e0'}}>Box 3</div>
    </div>
  );
}