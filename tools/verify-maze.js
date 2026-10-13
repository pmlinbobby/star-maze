// 最终验证：对齐 star-maze.html 的实际逻辑，跑 5000 局
const DIRS=[[0,-1,'up'],[1,0,'right'],[0,1,'down'],[-1,0,'left']];
const MW=13,MH=13;
let grid,house={x:0,y:0}, door={x:0,y:0};

function carve(g,x0,y0,x1,y1){
  if(x1<x0){const t=x0;x0=x1;x1=t;}
  if(y1<y0){const t=y0;y0=y1;y1=t;}
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)
    if(x>0&&y>0&&x<MW-1&&y<MH-1)g[y][x]=0;
}
function walkable(x,y){
  if(x<0||y<0||x>=MW||y>=MH)return false;
  if(grid[y]===undefined||grid[y][x]===undefined)return false;
  if(grid[y][x]===1)return false;
  if(house){
    const hx=house.x,hy=house.y;
    if((x===hx&&y===hy)||(x===hx+1&&y===hy)||(x===hx&&y===hy+1))return false;
  }
  return true;
}
function bfs(px,py){
  const dist={},par={},q=[[px,py]];let head=0;
  dist[px+','+py]=0;
  while(head<q.length){
    const cc=q[head++];
    for(const d of DIRS){
      const nx=cc[0]+d[0],ny=cc[1]+d[1];
      if(!walkable(nx,ny))continue;
      const k=nx+','+ny;
      if(dist[k]!==undefined)continue;
      dist[k]=dist[cc[0]+','+cc[1]]+1;par[k]=cc;q.push([nx,ny]);
    }
  }
  return{dist,par};
}
function dist(ax,ay,bx,by){
  if(ax===bx&&ay===by)return 0;
  const r=bfs(ax,ay);
  return r.dist[bx+','+by]===undefined?999:r.dist[bx+','+by];
}
function ensureConnected(g){
  function flood(){
    const seen=[];
    for(let y=0;y<MH;y++){seen[y]=[];for(let x=0;x<MW;x++)seen[y][x]=false;}
    const q=[[1,1]];seen[1][1]=true;let head=0;
    while(head<q.length){
      const cc=q[head++];
      for(let i=0;i<4;i++){
        const nx=cc[0]+DIRS[i][0],ny=cc[1]+DIRS[i][1];
        if(nx<1||ny<1||nx>=MW-1||ny>=MH-1)continue;
        if(g[ny][nx]===1||seen[ny][nx])continue;
        seen[ny][nx]=true;q.push([nx,ny]);
      }
    }
    return seen;
  }
  let guard=0;
  while(guard++<60){
    const seen=flood();
    let bx=-1,by=-1;
    for(let y=1;y<MH-1&&by<0;y++)for(let x=1;x<MW-1;x++)
      if(g[y][x]===0&&!seen[y][x]){bx=x;by=y;break;}
    if(by<0)return true;
    let tx=-1;
    for(let x=bx;x<MW-1;x++){if(seen[by][x]){tx=x;break;}}
    if(tx>bx){carve(g,bx,by,tx,by);continue;}
    for(let y=by;y<MH-1;y++){if(seen[y][bx]){tx=y;break;}}
    if(tx>by){carve(g,bx,by,bx,tx);continue;}
    carve(g,bx,by,bx,Math.max(by,1));
    carve(g,bx,1,Math.max(bx,1),1);
  }
  return false;
}
function genMaze(){
  const g=[];
  for(let y=0;y<MH;y++){g[y]=[];for(let x=0;x<MW;x++)g[y][x]=1;}
  const CW=Math.ceil(MW/2),CH=Math.ceil(MH/2);
  const corridor=(x1,y1,x2,y2)=>{
    if(x1===x2||y1===y2){carve(g,x1,y1,x2,y2);return;}
    const cx2=Math.random()<0.5?x1:x2, cy2=Math.random()<0.5?y1:y2;
    carve(g,x1,y1,cx2,cy2);carve(g,cx2,cy2,x2,y2);
  };
  for(let cy=0;cy<CH;cy++)for(let cx=0;cx<CW;cx++){
    if(Math.random()<0.42)continue;
    let w=1+2*((Math.random()*2)|0),h=1+2*((Math.random()*2)|0);
    let ox=cx*2+1-((w-1)>>1),oy=cy*2+1-((h-1)>>1);
    if(ox<1||oy<1||ox+w>MW-1||oy+h>MH-1){w=h=1;ox=cx*2+1;oy=cy*2+1;}
    carve(g,ox,oy,ox+w-1,oy+h-1);
  }
  for(let cy=0;cy<CH;cy++)for(let cx=0;cx<CW;cx++){
    const ax=cx*2+1,ay=cy*2+1;
    if(cx<CW-1&&Math.random()<0.72)corridor(ax,ay,cx*2+3,ay);
    if(cy<CH-1&&Math.random()<0.72)corridor(ax,ay,ax,cy*2+3);
  }
  for(let k=0;k<6;k++){
    const wx=1+((Math.random()*(MW-2))|0),wy=1+((Math.random()*(MH-2))|0);
    carve(g,wx,wy,wx,wy);
  }
  carve(g,1,1,3,3);
  ensureConnected(g);
  return g;
}
function gridEmpty2x2(x,y){
  return grid[y][x]===0&&grid[y][x+1]===0&&grid[y+1][x]===0&&grid[y+1][x+1]===0;
}
function findHouse(){
  for(let y=1;y<=MH-3;y++)for(let x=MW-3;x>=1;x--)
    if(gridEmpty2x2(x,y))return{x,y};
  return null;
}
function openDoorExit(hx,hy){
  const dx=hx+1,dy=hy+1;
  let guard=0;
  while(guard++<8){
    if(dist(1,1,dx,dy)!==999)return true;
    let best=null;
    for(let x=dx+1;x<MW-1;x++){if(dist(1,1,x,dy)!==999){best=[x,dy];break;}}
    for(let y=dy+1;y<MH-1;y++){
      if(dist(1,1,dx,y)!==999){if(!best||(y-dy)<(best[0]-dx))best=[dx,y];break;}
    }
    for(let y=dy-1;y>=1;y--){
      if(dist(1,1,dx,y)!==999){if(!best||(dy-y)<(best[0]-dx))best=[dx,y];break;}
    }
    if(!best)for(let x=dx-1;x>=1;x--){if(dist(1,1,x,dy)!==999){best=[x,dy];break;}}
    if(!best){carve(grid,dx,dy,dx,MH-2);carve(grid,dx,MH-2,MW-2,MH-2);break;}
    carve(grid,dx,dy,best[0],best[1]);
  }
  return dist(1,1,dx,dy)!==999;
}
function firstStep(px,py,tx,ty){
  const r=bfs(px,py);
  if(r.dist[tx+','+ty]===undefined)return null;
  let cur=[tx,ty],prev=[tx,ty];
  while(!(cur[0]===px&&cur[1]===py)){prev=cur;cur=r.par[cur[0]+','+cur[1]];if(!cur)return null;}
  for(const d of DIRS)if(d[0]===prev[0]-px&&d[1]===prev[1]-py)return d[2];
  return null;
}

let noHouse=0,doorUnreach=0,starShort=0,hintBad=0,starUnreach=0,npcFail=0;
let open=0,tot=0,de=0,doorSteps=0;
const N=5000;
for(let n=0;n<N;n++){
  let attempt=0, ok=false;
  while(attempt++<30 && !ok){
    grid=genMaze();
    house=findHouse();
    if(!house){house={x:MW-5,y:1};carve(grid,MW-5,1,MW-2,3);}
    openDoorExit(house.x,house.y);
    ensureConnected(grid);
    door={x:house.x+1,y:house.y+1};
    ok=(dist(1,1,door.x,door.y)!==999);
  }
  if(!ok){carve(grid,MW-6,1,MW-3,3);house={x:MW-5,y:1};door={x:MW-4,y:2};}

  if(!walkable(1,1))return void console.log('出生点被堵!');
  if(dist(1,1,door.x,door.y)===999)doorUnreach++;
  doorSteps+=Math.min(dist(1,1,door.x,door.y),999);

  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){tot++;if(grid[y][x]===0)open++;}
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){
    if(grid[y][x]!==0)continue;
    let o=0;
    for(const d of DIRS){const ax=x+d[0],ay=y+d[1];if(ax<1||ay<1||ax>=MW-1||ay>=MH-1)continue;if(grid[ay][ax]===0)o++;}
    if(o<=1)de++;
  }

  let npcAt={x:3,y:1},g2=0;
  while((!walkable(npcAt.x,npcAt.y)||dist(1,1,npcAt.x,npcAt.y)<2||(npcAt.x===1&&npcAt.y===1))&&g2++<200){
    npcAt={x:1+((Math.random()*13)|0),y:1+((Math.random()*11)|0)};
  }
  if(g2>=200)npcFail++;

  const stars=[];let tries=0;
  while(stars.length<5&&tries<600){
    tries++;
    const x=1+((Math.random()*13)|0),y=1+((Math.random()*11)|0);
    if(!walkable(x,y))continue;
    if(dist(1,1,x,y)===999)continue;
    if(dist(1,1,x,y)<5)continue;
    if(x===npcAt.x&&y===npcAt.y)continue;
    if(x===door.x&&y===door.y)continue;
    let ok=true;
    for(const s of stars)if(Math.abs(s.x-x)+Math.abs(s.y-y)<4){ok=false;break;}
    if(!ok)continue;
    stars.push({x,y});
  }
  tries=0;
  while(stars.length<5&&tries<800){
    tries++;
    const sx=1+((Math.random()*13)|0),sy=1+((Math.random()*11)|0);
    if(!walkable(sx,sy)||dist(1,1,sx,sy)===999)continue;
    if(sx===npcAt.x&&sy===npcAt.y)continue;
    if(sx===door.x&&sy===door.y)continue;
    let dup=false;
    for(const s of stars)if(s.x===sx&&s.y===sy){dup=true;break;}
    if(dup)continue;
    stars.push({x:sx,y:sy});
  }
  if(stars.length<5)starShort++;

  for(const s of stars){
    const d=firstStep(1,1,s.x,s.y);
    if(!d){starUnreach++;continue;}
    const before=dist(1,1,s.x,s.y);
    const dd=DIRS.find(z=>z[2]===d);
    const nx=1+dd[0],ny=1+dd[1];
    if(!(walkable(nx,ny)&&dist(nx,ny,s.x,s.y)===before-1))hintBad++;
  }
}
console.log('局数                ',N);
console.log('找不到小屋          ',noHouse);
console.log('门不可达            ',doorUnreach);
console.log('星星放不满 5 颗     ',starShort);
console.log('星星落在不可达区    ',starUnreach);
console.log('提示方向错误        ',hintBad);
console.log('村长放置失败        ',npcFail);
console.log('平均空地占比        ',(open/tot*100).toFixed(0)+'%');
console.log('平均死胡同          ',(de/N).toFixed(1),'个');
console.log('起点→门 平均步数    ',(doorSteps/N).toFixed(1));