local input = assert(app.params.input)
local output = assert(app.params.output)
local configFile = assert(io.open(assert(app.params.config), 'r'))
local config = json.decode(configFile:read('*a')); configFile:close()
app.fs.makeAllDirectories(output)
local names = app.fs.listFiles(input)
table.sort(names)
local report = {}
local pc = app.pixelColor
local cache = {}
local function adjusted(value)
  if cache[value] then return cache[value] end
  local a = pc.rgbaA(value)
  if a == 0 then return value end
  local r, g, b = pc.rgbaR(value), pc.rgbaG(value), pc.rgbaB(value)
  local gray = r*config.lumaWeights[1] + g*config.lumaWeights[2] + b*config.lumaWeights[3]
  local function channel(v)
    local saturated = gray + config.saturation*(v-gray)
    local contrasted = saturated*config.contrast + 255*(1-config.contrast)/2
    return math.floor(math.max(0, math.min(255, contrasted*config.brightness)) + 0.5)
  end
  local result = pc.rgba(channel(r), channel(g), channel(b), a)
  cache[value] = result
  return result
end
for _, name in ipairs(names) do
  if name:lower():match('%.png$') then
    print('Processing '..name)
    local sprite = assert(app.open(app.fs.joinPath(input, name)))
    assert(sprite.width == 512 and sprite.height == 512 and #sprite.frames == 1, 'Unexpected dimensions or frames: '..name)
    assert(sprite.colorMode == ColorMode.RGB and #sprite.cels == 1, 'Expected flat RGBA input: '..name)
    local cel = sprite.cels[1]
    local image = cel.image:clone()
    for pixel in image:pixels() do pixel(adjusted(pixel())) end
    cel.image = image
    local spriteName = name:gsub('%.png$', '.aseprite')
    local destination = app.fs.joinPath(output, spriteName)
    sprite:saveAs(destination)
    assert(app.fs.isFile(destination), 'Sprite was not saved: '..destination)
    report[#report+1] = {name=name, width=sprite.width, height=sprite.height, frames=#sprite.frames, output=destination}
    sprite:close()
  end
end
assert(#report == 64, 'Expected all 64 supplied icons')
local receipt = assert(io.open(app.fs.joinPath(output, 'processed.json'), 'w'))
receipt:write(json.encode(report)); receipt:close()
print('Processed '..#report..' icons')
app.exit()
