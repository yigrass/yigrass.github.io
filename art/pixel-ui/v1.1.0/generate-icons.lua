-- Original 16px indexed artwork inspired by 1990s desktop metaphors.
-- Run via the aseprite-automation wrapper, then export each sprite separately.
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
local function rect(i,x,y,w,h,c)
  for py=y,y+h-1 do for px=x,x+w-1 do i:drawPixel(px,py,c) end end
end
local items = {}
local function add(name,w,h,paint)
  local sprite = Sprite(w,h,ColorMode.INDEXED)
  sprite:setPalette(palette)
  sprite.transparentColor = 0
  local i = Image(w,h,ColorMode.INDEXED)
  i:clear(0)
  paint(i)
  sprite:newCel(sprite.layers[1],1,i,Point(0,0))
  sprite:saveAs(app.fs.joinPath(output,name..".aseprite"))
  items[#items+1] = {name=name,image=i:clone()}
  trace:write("created "..name.." "..w.."x"..h.." indexed\n")
  trace:flush()
  sprite:close()
end
add("computer",16,16,function(i)
  rect(i,2,1,12,10,1);rect(i,1,0,12,10,3);rect(i,1,0,11,1,2)
  rect(i,1,1,1,8,2);rect(i,2,1,10,8,4);rect(i,3,2,8,6,5)
  rect(i,4,3,6,4,6);rect(i,4,3,6,1,8);rect(i,4,4,1,3,17)
  rect(i,6,10,3,2,4);rect(i,4,11,7,1,2)
  rect(i,1,13,14,3,1);rect(i,0,12,14,3,3);rect(i,0,12,13,1,2)
  rect(i,1,13,6,1,4);rect(i,9,13,3,1,1);i:drawPixel(13,13,13)
end)
add("control-panel",16,16,function(i)
  rect(i,1,3,14,11,1);rect(i,0,2,14,11,3);rect(i,0,2,13,1,2)
  rect(i,1,3,12,2,5);rect(i,1,5,12,7,2)
  rect(i,2,6,2,2,6);rect(i,5,6,2,2,12);rect(i,8,6,2,2,7)
  rect(i,2,9,2,2,10);rect(i,5,9,2,2,4);rect(i,8,9,2,2,13)
  -- A small spanner sits across the panel, with a stepped one-pixel contour.
  for n=0,5 do rect(i,8+n,14-n,2,2,1);i:drawPixel(8+n,14-n,3) end
  rect(i,12,6,4,4,1);rect(i,13,6,2,3,3);rect(i,14,5,2,2,0)
  i:drawPixel(12,7,2);i:drawPixel(9,14,2)
end)
add("hard-disk",16,16,function(i)
  rect(i,2,5,12,1,1);rect(i,1,6,14,1,1);rect(i,0,7,16,7,1)
  rect(i,2,6,12,1,2);rect(i,1,7,14,3,3);rect(i,2,7,11,1,2)
  rect(i,1,10,14,3,4);rect(i,1,10,14,1,2);rect(i,2,11,9,1,3)
  rect(i,3,8,8,1,4);i:drawPixel(13,11,13);rect(i,2,14,2,1,1);rect(i,12,14,2,1,1)
end)
add("floppy",16,16,function(i)
  rect(i,2,0,11,1,1);rect(i,1,1,13,14,1);rect(i,2,15,11,1,1)
  rect(i,2,1,11,13,5);rect(i,2,1,1,12,7);rect(i,4,1,7,5,3)
  rect(i,5,1,1,4,2);rect(i,8,1,2,4,1);rect(i,3,8,9,6,2)
  rect(i,3,8,9,1,4);rect(i,4,10,7,1,17);rect(i,4,12,7,1,17)
  i:drawPixel(2,14,3);i:drawPixel(12,14,3)
end)
add("cdrom",16,16,function(i)
  rect(i,2,4,12,1,1);rect(i,1,5,14,1,1);rect(i,0,6,16,7,1)
  rect(i,2,5,12,1,2);rect(i,1,6,14,5,3);rect(i,1,6,14,1,2)
  rect(i,2,8,9,2,4);rect(i,3,8,8,1,1);i:drawPixel(13,9,13)
  local rows = {{9,13},{8,14},{7,15},{7,15},{7,15},{8,14},{9,13}}
  for row,range in ipairs(rows) do rect(i,range[1],row+8,range[2]-range[1]+1,1,1) end
  rect(i,9,10,5,1,2);rect(i,8,11,7,3,3);rect(i,9,14,5,1,4)
  rect(i,8,11,2,1,8);rect(i,8,12,2,1,17);rect(i,12,13,3,1,10)
  rect(i,11,11,2,3,1);i:drawPixel(11,12,2);i:drawPixel(13,11,2)
end)
local function arrow(i,direction)
  for y=2,12 do
    local x=math.abs(y-7)+1
    for p=x,7 do
      local px=direction=="forward" and 15-p or p
      i:drawPixel(px,y,(p==x or y==2 or y==12) and 1 or 13)
    end
  end
  local start=direction=="forward" and 2 or 8
  rect(i,start,5,6,5,1);rect(i,start,6,6,3,13)
  if direction=="forward" then rect(i,2,6,1,3,1) else rect(i,13,6,1,3,1) end
end
add("back",16,16,function(i) arrow(i,"back") end)
add("forward",16,16,function(i) arrow(i,"forward") end)
add("up",16,16,function(i)
  for x=2,12 do
    local y=math.abs(x-7)+1
    for p=y,7 do i:drawPixel(x,p,(p==y or x==2 or x==12) and 1 or 13) end
  end
  rect(i,5,8,5,6,1);rect(i,6,8,3,5,13)
end)
add("contact-sheet",512,96,function(i)
  rect(i,0,0,512,96,6)
  for n,item in ipairs(items) do
    for y=0,15 do for x=0,15 do
      local c=item.image:getPixel(x,y)
      if c~=0 then rect(i,(n-1)*64+16+x*2,32+y*2,2,2,c) end
    end end
  end
end)
trace:close()
app.exit()
