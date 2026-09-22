local tracePath = app.params["trace"]
local outputPath = app.params["output"]

if not tracePath or not outputPath then
  error("doctor.lua requires trace and output script parameters")
end

local function trace(message)
  local file = assert(io.open(tracePath, "a"))
  file:write(message .. "\n")
  file:close()
end

trace("01-script-start")
local sprite = Sprite(8, 8, ColorMode.RGB)
sprite.layers[1].name = "doctor"
trace("02-sprite-created")

for index = 1, 2 do
  local frame
  if index == 1 then
    frame = sprite.frames[1]
  else
    frame = sprite:newFrame()
  end
  local image = Image(8, 8, ColorMode.RGB)
  if index == 1 then
    image:clear(Color { r=0, g=220, b=120, a=255 })
  else
    image:clear(Color { r=30, g=120, b=230, a=255 })
  end
  sprite:newCel(sprite.layers[1], frame, image, Point(0, 0))
  frame.duration = 0.1
end
trace("03-frames-created")

local tag = sprite:newTag(1, 2)
tag.name = "doctor"
tag.aniDir = AniDir.FORWARD
trace("04-tag-created")

sprite:saveAs(outputPath)
trace("05-sprite-saved")
sprite:close()
trace("06-sprite-closed")
app.exit()
