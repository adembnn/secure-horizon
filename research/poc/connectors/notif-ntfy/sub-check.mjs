// Usage: node sub-check.mjs <server> <topic> <marker> <timeout_ms>
// Subscribes to the JSON stream (since=all), exits 0 when a message containing marker is seen, printing it.
const [server,topic,marker,to]=process.argv.slice(2);
const ac=new AbortController(); const t=setTimeout(()=>{console.error("TIMEOUT");process.exit(2)},+to||20000);
const r=await fetch(`${server}/${topic}/json?since=all`,{signal:ac.signal});
const dec=new TextDecoder(); let buf="";
for await(const chunk of r.body){buf+=dec.decode(chunk,{stream:true});let i;
 while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i);buf=buf.slice(i+1);if(!line.trim())continue;
  const m=JSON.parse(line);
  if(m.event==="message"&&JSON.stringify(m).includes(marker)){clearTimeout(t);console.log(JSON.stringify(m));ac.abort();process.exit(0);}}}
