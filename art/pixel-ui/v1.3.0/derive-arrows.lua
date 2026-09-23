-- All directions and disabled states come from the editable upward PNG.
local input, output = assert(app.params.input), assert(app.params.output)
app.fs.makeAllDirectories(output)
local trace = assert(io.open(app.fs.joinPath(output,"derive.log"),"w"))
local source = assert(app.open(input))
assert(source.width==15 and source.height==15 and #source.frames==1,"Keep the source 15x15 and single-frame")
local src, palette = source.cels[1].image, Palette(256)
palette:setColor(0,Color{r=0,g=0,b=0,a=0})
local lookup, count = {}, 0
local function index(r,g,b,a)
  if a==0 then return 0 end
  assert(a==255,"Keep binary transparency; do not antialias the arrow")
  local key = r..","..g..","..b
  if not lookup[key] then
    count=count+1; assert(count<256,"Too many colors")
    palette:setColor(count,Color{r=r,g=g,b=b,a=255}); lookup[key]=count
  end
  return lookup[key]
end
local pixels={}
for y=0,14 do for x=0,14 do
  local value=src:getPixel(x,y)
  local r,g,b,a
  if source.colorMode==ColorMode.INDEXED then
    local color=source.palettes[1]:getColor(value)
    r,g,b,a=color.red,color.green,color.blue,value==source.transparentColor and 0 or color.alpha
  elseif source.colorMode==ColorMode.RGB then
    r,g,b,a=app.pixelColor.rgbaR(value),app.pixelColor.rgbaG(value),app.pixelColor.rgbaB(value),app.pixelColor.rgbaA(value)
  else
    r=app.pixelColor.grayaV(value); g=r; b=r; a=app.pixelColor.grayaA(value)
  end
  pixels[y*15+x+1]=index(r,g,b,a)
end end
source:close()
assert(count>0,"The source must contain a visible arrow")
local white, gray, silver = index(255,255,255,255),index(128,128,128,255),index(192,192,192,255)
local sheet=Image(100,50,ColorMode.INDEXED); sheet:clear(silver)
local function save(name, image)
  local sprite=Sprite(image.width,image.height,ColorMode.INDEXED)
  sprite:setPalette(palette); sprite.transparentColor=0
  sprite:newCel(sprite.layers[1],1,image,Point(0,0))
  sprite:saveAs(app.fs.joinPath(output,name..".aseprite")); sprite:close()
  trace:write("saved "..name.."\n"); trace:flush()
end
for direction,name in ipairs({"up","right","down","left"}) do
  local normal=Image(15,15,ColorMode.INDEXED); normal:clear(0)
  for y=0,14 do for x=0,14 do
    local rx,ry=x,y
    for turn=1,direction-1 do rx,ry=14-ry,rx end
    normal:drawPixel(rx,ry,pixels[y*15+x+1])
  end end
  local disabled=Image(15,15,ColorMode.INDEXED); disabled:clear(0)
  -- Fixed bottom-right highlight, applied after rotating the arrow.
  for y=0,13 do for x=0,13 do if normal:getPixel(x,y)~=0 then disabled:drawPixel(x+1,y+1,white) end end end
  for y=0,14 do for x=0,14 do if normal:getPixel(x,y)~=0 then disabled:drawPixel(x,y,gray) end end end
  if name~="up" then save("arrow-"..name,normal) end
  save("arrow-"..name.."-disabled",disabled)
  for y=0,14 do for x=0,14 do
    local n,d=normal:getPixel(x,y),disabled:getPixel(x,y)
    if n~=0 then sheet:drawPixel((direction-1)*25+5+x,5+y,n) end
    if d~=0 then sheet:drawPixel((direction-1)*25+5+x,30+y,d) end
  end end
end
save("contact-sheet",sheet)
trace:close()
app.exit()
