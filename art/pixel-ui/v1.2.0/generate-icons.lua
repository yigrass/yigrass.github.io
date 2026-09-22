-- Original indexed icons for the Explorer project categories.
local output = assert(app.params.output, "output directory is required")
app.fs.makeAllDirectories(output)
local trace = assert(io.open(app.fs.joinPath(output, "generation.log"), "w"))
local colors = {
  {0,0,0,0}, {0,0,0,255}, {255,255,255,255}, {192,192,192,255},
  {128,128,128,255}, {0,0,128,255}, {0,128,128,255}, {0,0,255,255},
  {0,255,255,255}, {255,255,0,255}, {224,192,96,255}, {128,96,32,255},
  {192,48,32,255}, {0,128,0,255}, {192,255,255,255}, {255,240,176,255},
  {64,64,64,255}, {128,192,224,255}
}
local palette = Palette(256)
for n=0,255 do
  local c = colors[n+1] or {0,0,0,255}
  palette:setColor(n,Color{r=c[1],g=c[2],b=c[3],a=c[4]})
end
local function rect(image,x,y,w,h,color)
  for py=y,y+h-1 do for px=x,x+w-1 do image:drawPixel(px,py,color) end end
end
local items = {}
local function add(name,w,h,paint)
  trace:write("creating "..name.."\n"); trace:flush()
  local sprite=Sprite(w,h,ColorMode.INDEXED)
  sprite:setPalette(palette)
  sprite.transparentColor=0
  local image=Image(w,h,ColorMode.INDEXED)
  image:clear(0)
  paint(image)
  sprite:newCel(sprite.layers[1],1,image,Point(0,0))
  sprite:saveAs(app.fs.joinPath(output,name..".aseprite"))
  items[#items+1]={name=name,image=image:clone()}
  sprite:close()
  trace:write("saved "..name.." "..w.."x"..h.." indexed\n"); trace:flush()
end
add("flash-drive",16,16,function(i)
  rect(i,5,0,6,6,1);rect(i,6,1,4,4,3);rect(i,6,1,4,1,2)
  rect(i,6,2,1,2,4);rect(i,9,2,1,2,4)
  rect(i,3,5,10,9,1);rect(i,4,6,8,7,6)
  rect(i,4,6,7,1,8);rect(i,4,7,1,5,17)
  rect(i,11,7,1,6,5);rect(i,5,13,6,2,1)
  rect(i,5,12,6,1,4);rect(i,6,8,4,1,3)
  i:drawPixel(10,10,13);i:drawPixel(6,13,3)
end)
add("text-file",16,16,function(i)
  rect(i,3,0,8,1,1);rect(i,2,1,10,14,1)
  rect(i,3,1,8,13,2);rect(i,11,4,2,11,1)
  rect(i,11,5,1,9,2);rect(i,3,14,9,1,4)
  rect(i,10,1,1,3,4);rect(i,11,2,1,2,3);i:drawPixel(12,3,1)
  rect(i,10,4,3,1,1);i:drawPixel(11,3,2)
  rect(i,4,6,6,1,5);rect(i,4,8,7,1,4)
  rect(i,4,10,7,1,4);rect(i,4,12,5,1,4)
end)
add("contact-sheet",160,64,function(i)
  rect(i,0,0,160,64,3)
  for n,item in ipairs(items) do
    for y=0,15 do for x=0,15 do
      local color=item.image:getPixel(x,y)
      if color~=0 then rect(i,8+(n-1)*80+x*3,8+y*3,3,3,color) end
    end end
  end
end)
trace:close()
app.exit()
