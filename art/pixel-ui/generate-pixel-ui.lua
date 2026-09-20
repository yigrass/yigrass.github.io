-- Deterministic indexed pixel assets. Run through the aseprite-automation wrapper.
local output = assert(app.params.output, "output directory is required")
app.fs.makeAllDirectories(output)
local trace = io.open(app.fs.joinPath(output, "generation.log"), "w")
local colors = {
  {0,0,0,0}, {0,0,0,255}, {255,255,255,255}, {192,192,192,255},
  {128,128,128,255}, {0,0,128,255}, {0,128,128,255}, {0,0,255,255},
  {0,255,255,255}, {255,255,0,255}, {224,192,96,255}, {128,96,32,255},
  {192,48,32,255}, {0,128,0,255}, {192,255,255,255}, {255,240,176,255},
  {64,64,64,255}, {128,192,224,255}
}
local palette = Palette(256)
for index = 0,255 do
  local color = colors[index+1] or {0,0,0,255}
  palette:setColor(index, Color{r=color[1],g=color[2],b=color[3],a=color[4]})
end
local items = {}
local function rect(image,x,y,w,h,color)
  for py=y,y+h-1 do for px=x,x+w-1 do image:drawPixel(px,py,color) end end
end
local function outline(image,x,y,w,h,color)
  rect(image,x,y,w,1,color);rect(image,x,y+h-1,w,1,color)
  rect(image,x,y,1,h,color);rect(image,x+w-1,y,1,h,color)
end
local function add(name,width,height,painter)
  local sprite = Sprite(width,height,ColorMode.INDEXED)
  sprite:setPalette(palette)
  sprite.transparentColor = 0
  local image = Image(width,height,ColorMode.INDEXED)
  image:clear(0)
  painter(image)
  sprite:newCel(sprite.layers[1],1,image,Point(0,0))
  sprite:saveAs(app.fs.joinPath(output,name..".aseprite"))
  items[#items+1] = {name=name,width=width,height=height,image=image:clone()}
  trace:write("created "..name.." "..width.."x"..height.." indexed\n")
  trace:flush()
  sprite:close()
end
add("profile",16,16,function(i)
  rect(i,3,2,12,14,1);rect(i,2,1,12,14,4);rect(i,2,1,11,13,2)
  rect(i,4,3,3,3,10);rect(i,4,3,3,1,11);rect(i,3,7,5,4,5)
  rect(i,4,7,3,1,7);rect(i,9,4,3,1,4);rect(i,9,6,3,1,4)
  rect(i,9,8,3,1,4);rect(i,4,12,8,1,4)
end)
add("works",16,16,function(i)
  rect(i,1,4,6,2,11);rect(i,2,3,5,2,1);rect(i,2,4,4,1,15)
  rect(i,1,6,14,8,1);rect(i,1,5,12,8,11);rect(i,2,5,11,7,10)
  rect(i,2,5,10,1,15);rect(i,3,7,13,7,1);rect(i,2,6,13,7,10)
  rect(i,2,6,12,1,15);rect(i,2,7,1,5,15);rect(i,3,12,11,1,11)
end)
add("settings",16,16,function(i)
  rect(i,1,1,13,10,1);rect(i,0,0,13,10,3);rect(i,0,0,12,1,2)
  rect(i,1,1,11,8,4);rect(i,2,2,9,6,5);rect(i,3,3,7,4,6)
  rect(i,5,10,4,2,4);rect(i,3,12,8,2,1);rect(i,3,11,7,2,3)
  rect(i,9,7,7,9,1);rect(i,9,7,6,8,3);rect(i,10,8,1,6,4)
  rect(i,12,8,1,6,4);rect(i,14,8,1,6,4)
  rect(i,9,10,3,2,2);rect(i,11,8,3,2,2);rect(i,13,12,2,2,2)
end)
add("start",16,16,function(i)
  rect(i,1,2,6,5,1);rect(i,9,1,6,5,1);rect(i,1,9,6,5,1);rect(i,9,8,6,5,1)
  rect(i,2,2,5,4,12);rect(i,10,1,5,4,13);rect(i,2,9,5,4,7);rect(i,10,8,5,4,9)
end)
add("cursor",16,16,function(i)
  for y=0,10 do for x=0,math.min(y,8) do
    i:drawPixel(x,y,(x==0 or x==y or y==10) and 1 or 2)
  end end
  rect(i,1,10,3,2,2);i:drawPixel(1,12,1);i:drawPixel(2,11,1)
  rect(i,4,10,3,2,1);rect(i,5,11,3,2,1);rect(i,6,13,3,2,1)
  rect(i,5,10,1,2,2);rect(i,6,12,1,2,2);i:drawPixel(7,14,2)
end)
local cursorImage = items[#items].image
add("cursor-2x",32,32,function(i)
  for y=0,15 do for x=0,15 do rect(i,x*2,y*2,2,2,cursorImage:getPixel(x,y)) end end
end)
add("star",8,8,function(i)
  rect(i,3,0,1,7,8);rect(i,0,3,7,1,8);rect(i,2,2,3,3,14)
  rect(i,3,1,1,5,2);rect(i,1,3,5,1,2)
end)
add("minimize",8,8,function(i) rect(i,1,6,6,2,1) end)
add("maximize",8,8,function(i) outline(i,0,0,8,8,1);rect(i,0,1,8,1,1) end)
add("restore",8,8,function(i)
  outline(i,2,0,6,6,1);rect(i,2,1,6,1,1);rect(i,0,2,6,6,3)
  outline(i,0,2,6,6,1);rect(i,0,3,6,1,1)
end)
add("close",8,8,function(i)
  for y=1,6 do i:drawPixel(y,y,1);i:drawPixel(7-y,y,1) end
  for y=1,5 do i:drawPixel(y+1,y,1);i:drawPixel(6-y,y,1) end
end)
add("check",8,8,function(i)
  for x=0,2 do i:drawPixel(x,x+3,1);i:drawPixel(x,x+4,1) end
  for x=2,7 do i:drawPixel(x,7-x,1);i:drawPixel(x,8-x,1) end
end)
add("grip",8,8,function(i)
  for offset=0,2 do for p=0,2-offset do
    i:drawPixel(7-offset*3,7-p*3,4)
    if 6-offset*3>=0 then i:drawPixel(6-offset*3,7-p*3,2) end
  end end
end)
add("dither",2,2,function(i) i:drawPixel(0,0,2);i:drawPixel(1,1,2);i:drawPixel(1,0,3);i:drawPixel(0,1,3) end)
local assets = {}
for _,item in ipairs(items) do assets[#assets+1]={name=item.name,width=item.width,height=item.height,colorMode="indexed",paletteSize=256,frames=1} end
-- The review image is enlarged with integer pixel replication, never smoothing.
add("contact-sheet",672,112,function(i)
  rect(i,0,0,672,112,6)
  for index,item in ipairs(items) do
    if index<=14 then
      local cellX=(index-1)*48+4
      local scale=item.width<=8 and 4 or (item.width<=16 and 2 or 1)
      for y=0,item.height-1 do for x=0,item.width-1 do
        local color=item.image:getPixel(x,y)
        if color~=0 then rect(i,cellX+x*scale,40+y*scale,scale,scale,color) end
      end end
    end
  end
end)
local report=io.open(app.fs.joinPath(output,"source-manifest.json"),"w")
report:write(json.encode({schemaVersion=1,assetVersion="1.0.0",colorMode="indexed",paletteSize=256,usedPaletteEntries=#colors,assets=assets}))
report:close();trace:close();app.exit()
