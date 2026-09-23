-- One-time seed only. After export, the runtime PNG is the editable source.
local output = assert(app.params.output, "output directory is required")
app.fs.makeAllDirectories(output)
local trace = assert(io.open(app.fs.joinPath(output, "generation.log"), "w"))
trace:write("creating single up-arrow seed\n"); trace:flush()
local palette = Palette(256)
for index=0,255 do palette:setColor(index, Color{r=0,g=0,b=0,a=index==0 and 0 or 255}) end
local sprite = Sprite(15,15,ColorMode.INDEXED)
sprite:setPalette(palette)
sprite.transparentColor=0
local image = Image(15,15,ColorMode.INDEXED)
image:clear(0)
-- Preserve the existing seven-pixel-wide stepped triangle on an odd-size canvas.
for row=0,3 do
  for x=7-row,7+row do image:drawPixel(x,5+row,1) end
end
sprite:newCel(sprite.layers[1],1,image,Point(0,0))
sprite:saveAs(app.fs.joinPath(output,"scrollbar-arrow-initial.aseprite"))
sprite:close()
trace:write("saved 15x15 single-frame indexed seed; export separately\n")
trace:close()
app.exit()
