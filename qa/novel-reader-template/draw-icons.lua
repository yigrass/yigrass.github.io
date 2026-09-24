local out=assert(app.params.output)
app.fs.makeAllDirectories(out)
local log=assert(io.open(app.fs.joinPath(out,"draw.log"),"w"))
local colors={
  ["."]={0,0,0,0},["k"]={32,34,38,255},["w"]={255,255,240,255},
  ["s"]={188,201,207,255},["h"]={100,119,135,255},["g"]={208,164,72,255},
  ["y"]={255,224,137,255},["b"]={76,96,124,255},["r"]={119,61,48,255},
  ["c"]={54,92,147,255},["l"]={108,173,219,255}
}
local drawings={
  ["sword"]={
    "............kkk.","...........kwwk.","..........kwshk.",".........kwshk..",
    "........kwshk...",".......kwshk....","..kk..kwshk.....","..kgkkwshk......",
    "...kygshk.......","....kgyk........","...krkgykk......","..krhk.kggk.....",
    ".krhk...kkk.....","kgyk............","kygk............",".kk............."},
  ["book-closed"]={
    "................","...kkkkkkkkkk...","..kwwwwwwwwwk...",".kssssssssssk...",
    ".kbbbbbbbbbbhk..",".kbllllllllbhk..",".kblbbbbbbllhk..",".kblbyyyybllhk..",
    ".kblbggggbllhk..",".kblbbbbbbllhk..",".kblbbbbbbllhk..",".kbllllllllbhk..",
    ".kbbbbbbbbbbhk..",".khhhhhhhhhhhk..","..kkkkkkkkkkk...","................"},
  ["book-open"]={
    "................",".kkkkk....kkkkk.","kwwwwwk..kwwwwwk","kwwwwwskkswwwwwk",
    "kwhhhwwkkwwhhhsk","kwwwwwskkswwwwwk","kwhhhwwkkwwhhhsk","kwwwwwskkswwwwwk",
    "kwhhhwwkkwwhhhsk","kwwwwwskkswwwwwk","kwhhwwwkkwwhhwsk","kwwwwwskkswwwwwk",
    "kssssswhhwsssssk",".kkkkkkggkkkkkk.",".......kk.......","................"},
  ["information"]={
    "................","....kkkkkkkk....","..kkwwwwwwwwkk..",".kwwwwccwwwwwwk.",
    "kwwwwwccwwwwwwwk","kwwwwwwwwwwwwwwk","kwwwwcccwwwwwwwk","kwwwwwccwwwwwwwk",
    "kwwwwwccwwwwwwwk",".kwwwwccwwwwwwk.","..kwwccccwwwwk..","...kkwwwwwwkk...",
    "....kwkkkkk.....","....kwk.........","....kk..........","................"}
}
local names={"sword","book-closed","book-open","information"}
local palette=Palette(256);local indices={};local index=0
for _,letter in ipairs({".","k","w","s","h","g","y","b","r","c","l"}) do local c=colors[letter];palette:setColor(index,Color{r=c[1],g=c[2],b=c[3],a=c[4]});indices[letter]=index;index=index+1 end
for _,name in ipairs(names) do
  local sprite=Sprite(16,16,ColorMode.INDEXED);sprite:setPalette(palette);sprite.transparentColor=0
  local image=Image(16,16,ColorMode.INDEXED);image:clear(0)
  for y,row in ipairs(drawings[name]) do assert(#row==16,name.." row width");for x=1,16 do image:drawPixel(x-1,y-1,assert(indices[row:sub(x,x)])) end end
  sprite:newCel(sprite.layers[1],1,image,Point(0,0));sprite:saveAs(app.fs.joinPath(out,name..".aseprite"));sprite:close()
  log:write("saved "..name.." 16x16 indexed single frame\n");log:flush()
end
log:close();app.exit()
