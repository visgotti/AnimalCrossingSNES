const ColliderShape = {
    RECT: 0,
    POLYGON: 1,
    POINT: 2,
    CIRCLE: 3,
    LINE: 4,
};

export default () => {
    let loadedWorld;
    let default_collide_color = 0xff0000; // red
    let default_no_collide_color = 0x00ff00; // green
    let panelEl;
    let tagPanelWrapper;

    const colorLookup = {
        rect: {
            collide: default_collide_color,
            noCollide: default_no_collide_color,
        },
        polygon: {
            collide: default_collide_color,
            noCollide: default_no_collide_color,
        },
        circle: {
            collide: default_collide_color,
            noCollide: default_no_collide_color,
        },
        point: {
            collide: default_collide_color,
            noCollide: default_no_collide_color,
        },
        line: {
            collide: default_collide_color,
            noCollide: default_no_collide_color,
        },
    };

    const NO_TAG_CONSTANT = '__debug_plugin_tagless';
    const PLUGIN_GO_CONSTANT = '__debug_plugin_game_object';
    const addedColliders = [];
    let point_radius;
    let alpha;
    let tag_colors;

    let hideAllIsOn = false;

    const tCache = {};

    const getPluginGameObj = (_col) => {
        if(!_col[PLUGIN_GO_CONSTANT]) {
            console.error('collider without debug graphic:', _col);
            throw new Error(`Should have had plugin debug graphic value on collider`)
        }
        return _col[PLUGIN_GO_CONSTANT]
    }

    const anyCollidersTagsVisible = (_col) => {
        if(!_col.tags || !_col.tags.length) {
            return tagsLookup[NO_TAG_CONSTANT] && tagsLookup[NO_TAG_CONSTANT].toggled;
        }
        for(let i = 0; i < _col.tags.length; i++) {
            const curLookup = tagsLookup[_col.tags[i]];
            if(!curLookup) {
                throw new Error(`shoudl have found the lookup for tag ${_col.tags[i]}`)
            }
            if(curLookup.toggled) {
                return true;
            }
        }
        return false;
    }

    const updateCollidersVisibility = (_col) => {
        const gameObj = getPluginGameObj(_col);
        if(hideAllIsOn) {
            gameObj.visible = false;
            return;
        }
        gameObj.visible = anyCollidersTagsVisible(_col);
    }

    const createDebugPanel = (panelOpts) => {
        let defaultPanelOptions = {
            css: {
                className: '',
                id: 'collision-debug-panel',
            },
            panelWidth: '220px',
            panelHeight: '190px',
            corner: 'bottom-right',
            useInline: true,
        };
        if(typeof panelOpts === 'object') {
            panelOpts = {
                ...defaultPanelOptions,
                ...panelOpts,
            }
        } else {
            panelOpts = defaultPanelOptions;
        }

        if(typeof document !== 'undefined' && typeof document.body !== 'undefined') {
            panelEl = document.createElement('DIV');
            panelEl.style.zIndex = 1000000;
            panelEl.id = panelOpts.css?.id || defaultPanelOptions.css.id;
            panelEl.className = panelOpts.css?.className || '';

            const settingEl = document.createElement('DIV');
            settingEl.id = 'collision-debug-panel--settings-wrapper';

            // the tag panel wrapper that wraps each tag.
            tagPanelWrapper = document.createElement('DIV');
            tagPanelWrapper.id = `collision-debug-panel--tag-wrapper`;

            panelEl.appendChild(settingEl);
            panelEl.appendChild(tagPanelWrapper);
            const alphaLabel = document.createElement('DIV');
            alphaLabel.innerText = 'alpha:';
            const alphaSlider = document.createElement("INPUT");
            alphaSlider.className = `collision-debug-panel--settings-option`;
            alphaSlider.setAttribute("type", "number");
            alphaSlider.setAttribute("min", 0);
            alphaSlider.setAttribute("max", 1);
            alphaSlider.setAttribute("value", alpha);
            alphaSlider.setAttribute("step", .1);
            alphaSlider.addEventListener('input', (e) => {
                alpha = e.target.value;
                addedColliders.forEach(c => {
                    getPluginGameObj(c).alpha = alpha;
                });
            });

            const hideLabel = document.createElement('DIV');
            hideLabel.innerText = 'hide all:';

            const hideAll =document.createElement("INPUT");
            hideAll.setAttribute('type', 'checkbox');
            hideAll.className = `collision-debug-panel--settings-option`;

            hideAllIsOn = false;
            hideAll.checked = false;
            hideAll.addEventListener('change', (e) => {
                hideAllIsOn = e.target.checked;
                if(e.target.checked) {
                    addedColliders.forEach(c => {
                        getPluginGameObj(c).visible = false;
                    });
                } else {
                    addedColliders.forEach(c => {
                        updateCollidersVisibility(c);
                    });
                }
            });
            settingEl.appendChild(alphaLabel);
            settingEl.appendChild(alphaSlider);
            settingEl.appendChild(hideLabel);
            settingEl.appendChild(hideAll);

            if(panelOpts.useInline) {
                const bottom = '15px';
                const right = '15px';

                panelEl.style.right = right;
                panelEl.style.bottom = bottom;
                panelEl.style.backgroundColor = 'rgba(128, 128, 128, .5)';
                panelEl.style.borderRadius = '5px';
                panelEl.style.padding = '10px';
                panelEl.style.position = 'fixed';
                panelEl.style.display = 'flex';
                panelEl.style.flexDirection = 'column';
                panelEl.style.minHeight = panelOpts.panelHeight;
                panelEl.style.maxHeight = panelOpts.panelHeight;
                panelEl.style.height = panelOpts.panelHeight;
                panelEl.style.minWidth = panelOpts.panelWidth;
                panelEl.style.maxWidth = panelOpts.panelWidth;
                panelEl.style.width = panelOpts.panelWidth;

                settingEl.style.display = 'flex';
                settingEl.style.flexDirection = 'row';
                alphaSlider.style.maxWidth = '45px';
                alphaSlider.style.marginRight = '7px';

                tagPanelWrapper.style.display = 'flex';
                tagPanelWrapper.style.flexDirection = 'column';
                tagPanelWrapper.style.maxHeight = `${parseInt(panelOpts.panelHeight) - 30}px`;
                tagPanelWrapper.style.minHeight = `${parseInt(panelOpts.panelHeight) - 30}px`;
                tagPanelWrapper.style.height = `${parseInt(panelOpts.panelHeight) - 30}px`;

                tagPanelWrapper.style.maxWidth = `92%`;
                tagPanelWrapper.style.minWidth =  `92%`;
                tagPanelWrapper.style.width =  `92%`;
                tagPanelWrapper.style.marginLeft = '4%';

                tagPanelWrapper.style.marginTop = '10px';
                tagPanelWrapper.style.overflow = 'auto';
            }
            document.body.prepend(panelEl);
        }
    }

    const drawShape = (collider, hex) => {
        const g = new PIXI.Graphics();
        g.beginFill(hex, 1);
        let minX = 999999999;
        let minY = 999999999;
        const { shapeType, shapeData } = collider;
        switch(shapeType) {
            case ColliderShape.LINE:
                g.lineStyle(2, hex);

                shapeData.forEach(p => {
                    minX = Math.min(p.x, minX);
                    minY = Math.min(p.y, minY);
                });
                const mappedLine = shapeData.map(p => {
                    return new PIXI.Point(p.x-minX, p.y-minY);
                });
                g.moveTo(mappedLine[0].x, mappedLine[0].y);
                g.lineTo(mappedLine[1].x, mappedLine[1].y);
                break;
            case ColliderShape.RECT:
                g.drawRect(0, 0, shapeData.w, shapeData.h);
                break;
            case ColliderShape.POLYGON:
                shapeData.forEach(p => {
                    minX = Math.min(p.x, minX);
                    minY = Math.min(p.y, minY);
                });
                const points = shapeData.map(p => {
                    return new PIXI.Point(p.x-minX, p.y-minY);
                });
                points.push(points[0]);
                g.drawPolygon(points);
                break;
            case ColliderShape.POINT:
                g.drawCircle(point_radius, point_radius, point_radius);
                break;
            case ColliderShape.CIRCLE:
                g.drawCircle(shapeData.r, shapeData.r, shapeData.r);
                break;
            default:
                throw new Error(`Collider had invalid shapeType on it.`)
        }
        return g;
    }

    const getShapeTextures = (collider) => {
        const { shapeType, shapeData, tags } = collider;
        let color = null;
        if(tags && tags.length) {
            const first = tags.find(t => (t in tag_colors));
            if(typeof first !== 'undefined' && first !== null) {
                color = tag_colors[first];
            }
        }
        let shapeKey = '';
        if(color === null) {
            let minX = 999999999;
            let minY = 999999999;
            switch(shapeType) {
                case ColliderShape.RECT:
                    shapeKey = `r${shapeData.w}_${shapeData.h}`;
                    color = colorLookup.rect;
                    break;
                case ColliderShape.POLYGON:
                    shapeData.forEach(p => {
                        minX = Math.min(p.x, minX);
                        minY = Math.min(p.y, minY);
                    });
                    const points = shapeData.map(p => {
                        return new PIXI.Point(p.x-minX, p.y-minY);
                    });
                    shapeKey = `pol${points.map(d => `${d.x}_${d.y}`).join('_')}`;
                    color = colorLookup.polygon;
                    break;
                case ColliderShape.POINT:
                    shapeKey = `p`;
                    color = colorLookup.point;
                    break;
                case ColliderShape.CIRCLE:
                    shapeKey = `c${collider.shapeData.r}`;
                    color = colorLookup.circle;
                    break;
                case ColliderShape.LINE:
                    shapeData.forEach(p => {
                        minX = Math.min(p.x, minX);
                        minY = Math.min(p.y, minY);
                    });
                    shapeKey = `l${collider.shapeData.map(d => `${d.x-minX}_${d.y-minY}`).join('_')}`;
                    color = colorLookup.line;
                    break;
                default:
                    throw new Error(`Collider had invalid shapeType on it.`)
            }
        }

        const addToTextureObject = (collideState, _textureObject) => {
            let cacheKey = `${shapeKey}_${color[collideState]}`;
            if(!(cacheKey in tCache)) {
                const drawnG = drawShape(collider, color[collideState]);
                _textureObject[collideState] = PIXI.RenderTexture.create(drawnG.width, drawnG.height);
                loadedWorld.renderer.render(drawnG, _textureObject[collideState]);
                tCache[cacheKey] = _textureObject[collideState];
            } else {
                _textureObject[collideState] = tCache[cacheKey];
            }
        }

        const textureObject = {};
        addToTextureObject('collide', textureObject);
        addToTextureObject('noCollide', textureObject);
        return textureObject;
    }

    const checkShapeColorOpts = (_opts, shape) => {
        if(_opts[shape]) {
            if(isNaN(_opts[shape])) {
                if('collide' in _opts[shape]) {
                    colorLookup[shape].collide = _opts[shape].collide
                }
                if('noCollide' in _opts[shape]) {
                    colorLookup[shape].noCollide = _opts[shape].noCollide
                }
            } else {
                colorLookup[shape].collide = default_collide_color;
                colorLookup[shape].noCollide =  _opts[shape];
            }
        } else {
            colorLookup[shape].collide = default_collide_color;
            colorLookup[shape].noCollide = default_no_collide_color;
        }
    }
    const lineCollisionGraphic = new PIXI.Graphics();
    const collidingLines = [];
    const tagsLookup = {};
    const tagsToUpdate = [];

    const tagElIdFactory = (tagName) => {
        return `debug-panel-tag-${tagName}`
    }

    let panelUpdateTimeout = null;

    const makePanelTag = (tagName) => {
        const tagDisplayName = tagName === NO_TAG_CONSTANT ? 'not tagged' : tagName;
        const  { colliders, colliderColor, toggled } = tagsLookup[tagName];
        const newEl = document.createElement('DIV');
        newEl.innerText = tagDisplayName;
        newEl.style.display = 'flex';
        newEl.style.flexDirection = 'row';
        newEl.className = `debug-panel-tag`;
        newEl.id = tagElIdFactory(tagName);
        const toggleCheckbox = document.createElement('INPUT');
        toggleCheckbox.setAttribute('type', 'checkbox');

        toggleCheckbox.checked = toggled;
        toggleCheckbox.addEventListener('change', (e) => {
            tagsLookup[tagName].toggled = e.target.checked;
            if(!hideAllIsOn) {
                tagsLookup[tagName].colliders.forEach(c => {
                    updateCollidersVisibility(c);
                });
            }
        });
        const colliderCountDiv = document.createElement('DIV');
        colliderCountDiv.innerText = `(${colliders.length})`

        newEl.appendChild(toggleCheckbox);
        newEl.appendChild(colliderCountDiv);
        return newEl;
    }

    const getTagPanel = (tagName) => {
        return document.getElementById(tagElIdFactory(tagName));
    }

    const updatePanel = (updatedTags) => {
        for(let i = 0; i < updatedTags.length; i++) {
            if(!tagsToUpdate.includes(updatedTags[i])) {
                tagsToUpdate.push(updatedTags[i]);
            }
        }
        if(panelUpdateTimeout) {
            clearTimeout(panelUpdateTimeout);
            panelUpdateTimeout = null;
        }
     //   panelUpdateTimeout = setTimeout(() => {
            const orderedTags = Object.keys(tagsLookup).sort((a, b) => `${a}`.localeCompare(`${b}`));
            tagsToUpdate.forEach(t => {
                if(t in tagsLookup) {
                    const el = getTagPanel(t);
                    const newEl = makePanelTag(t);
                    if(el) {
                        el.insertAdjacentElement("afterEnd", newEl);
                        el.parentElement.removeChild(el);
                    } else {
                        // always want the no tag constant to be first element in array.
                        const tagIndex = t === NO_TAG_CONSTANT ? 0 : orderedTags.indexOf(t);
                        tagPanelWrapper.insertBefore(newEl, tagPanelWrapper.children[tagIndex]);
                    }
                } else {
                    // tag is not in lookup, means we removed it.
                    const el = getTagPanel(t);
                    if(!el) {
                        throw new Error(`Should have found panel object for removing tag ${t}`)
                    }
                    el.parentElement.removeChild(el);
                }
            });
            tagsToUpdate.length = 0;
            panelUpdateTimeout = null;
        //}, 500);
    }

    const handleRemoveColliderTag = (_col, tagNames, colliderTagArrayIsUpdated) => {
        tagNames = Array.isArray(tagNames) ? tagNames : [tagNames];
        tagNames.forEach(tagName => {
            // console.log('trying to delete tag name', tagName, 'from collider', _col);
            const found = tagsLookup[tagName];
            if(!found) throw new Error(`Should have found tag lookup object.`);
            const colliderIndex = tagsLookup[tagName].colliders.indexOf(_col);
            if(colliderIndex < 0) {
                throw new Error(`Should have found collider.`)
            }
            tagsLookup[tagName].colliders.splice(colliderIndex, 1);
            if(!tagsLookup[tagName].colliders.length) {
            //    console.log('DELETING TAG NAME', tagName);
                delete tagsLookup[tagName];
            }
        });

        // collider still has tags
        if(_col.tags && _col.tags.length && colliderTagArrayIsUpdated) {
            updateCollidersVisibility(_col);
            panelEl && updatePanel(tagNames);
        }
    }
    const handleAddColliderTag = (_col, tagNames) => {
        tagNames = Array.isArray(tagNames) ? tagNames : [tagNames];
        tagNames.forEach(tag => {
            if(!tagsLookup[tag]) {
                tagsLookup[tag] = { colliders: [], toggled: true, color: tag_colors[tag] }
            }
            tagsLookup[tag].colliders.push(_col);
        })
        updateCollidersVisibility(_col);
        panelEl && updatePanel(tagNames);
    }
    const default_colors = {
        collide: default_collide_color,
        noCollide: default_no_collide_color
    }

    return {
        type: 'collision',
        name: 'debug',
        init(w, opts) {
            loadedWorld = w;
            opts = opts ? opts : { panel: true };
            if('default' in opts) {
                if(isNaN(opts.default)) {
                    if('collide' in opts.default) {
                        default_collide_color = opts.default.collide;
                    } else {
                        default_collide_color = opts.default;
                    }
                    if('noCollide' in opts.default) {
                        default_no_collide_color = opts.default.collide;
                    } else {
                        default_no_collide_color = opts.default;
                    }
                } else {
                    default_no_collide_color = opts.default;
                }
            }
            default_colors.noCollide = default_no_collide_color;
            default_colors.collide = default_collide_color;

            point_radius = 'pointRadius' in opts ? opts.pointRadius : 3;
            alpha = 'alpha' in opts ? opts.alpha : .5;

            if(opts.panel) {
                createDebugPanel(opts.panel);
            }

            checkShapeColorOpts(opts, 'rect');
            checkShapeColorOpts(opts, 'polygon');
            checkShapeColorOpts(opts, 'circle');
            checkShapeColorOpts(opts, 'line');
            checkShapeColorOpts(opts, 'point');

            tag_colors = opts.tagColors ? { ...opts.tagColors} : {};

            if(opts.colorTags) {
                Object.keys(opts.colorTags).forEach(color => {
                    opts.colorTags[color].forEach(tag => {
                        if(tag in tag_colors) {
                            throw new Error(`Found multiple colors for tag ${tag}`);
                        }
                        tag_colors[tag] = color;
                    });
                });
            }
        },
        onAdded(col) {
            if(addedColliders.includes(col)) {
                console.error(col);
                throw new Error(`Trying to add collider twice.`)
            }
            col['debugid'] = Math.floor(Math.random() * 100009);
            addedColliders.push(col);
            const { noCollide, collide } = getShapeTextures(col);
            let position;
            if(col.sprite) {
                position = col.sprite.position;
            } else {
                let minX = 9999999999;
                let minY = 9999999999;
                if( Array.isArray(col.shapeData)) {
                    col.shapeData.forEach(p => {
                        minX = Math.min(p.x, minX);
                        minY = Math.min(p.y, minY);
                    });
                    position = { x: minX, y: minY };
                } else {
                    position = { ...col.shapeData };
                }
            }
            if(col.shapeType === ColliderShape.CIRCLE) {
                position.x = col.shapeData.x - col.shapeData.r;
                position.y = col.shapeData.y - col.shapeData.r;
            } else if(col.shapeType === ColliderShape.POINT) {
                position.x -= point_radius;
                position.y -= point_radius;
            }

            const gameObject = loadedWorld.addGameObject({ texture: noCollide, position, layer: col.layer, zIndex: Number.MAX_SAFE_INTEGER });
            gameObject.alpha = alpha;

            if(gameObject.colliders) {
                console.error(gameObject, gameObject.colliders);
                throw new Error(`WHAT THE FUCFK`)
            }
            col[PLUGIN_GO_CONSTANT] = gameObject;
            if(col.tags && col.tags.length) {
                handleAddColliderTag(col, col.tags)
            } else {
                handleAddColliderTag(col, NO_TAG_CONSTANT)
            }
            updateCollidersVisibility(col);

            col.onTagAdded((tag) => {
                // when a collider adds a tag, check to see if it was previously in the no tag constant array.
                if(tagsLookup[NO_TAG_CONSTANT] && tagsLookup[NO_TAG_CONSTANT].colliders.includes(col)) {
                    handleRemoveColliderTag(col, NO_TAG_CONSTANT, true);
                }
                handleAddColliderTag(col, tag);
            });

            col.onTagRemoved((tag) => {
                handleRemoveColliderTag(col, tag);
                if(!col.tags || !col.tags.length) {
                    handleAddColliderTag(_col, NO_TAG_CONSTANT, true)
                }
            });

            col.onCollisionStart((colB) => {
                if(!gameObject['___collisions']) {
                    gameObject['___collisions'] = 0;
                    gameObject.texture = collide;
                }
                gameObject['___collisions']++;
              //  console.log('count is ',gameObject['___collisions'])
            });

            col.onCollisionEnd((colB) => {
                if(!(--gameObject['___collisions'])) {
                  //  console.log('count is ', gameObject['___collisions'])
                    gameObject.texture = noCollide;
                    delete gameObject['___collisions']
                }
            });
            if(col.dynamic) {
            //    console.log('COL WAS', col)
                col.onPositionUpdate((dX, dY) => {
              //      console.log('CALLED ON ', col, 'GAME OBJECT WAS', gameObject);
                    gameObject.updatePosition(dX, dY);
                    if(gameObject.colliders) {
                        console.error(gameObject);
                        console.error(gameObject.colliders);
                        throw new Error('waht the fuck')
                    }
                });
                col.onRotationUpdate((dR, pivotPoint) => {
                    gameObject.updateRotation(dR);
                })
            }
            if(col.shapeType === ColliderShape.POLYGON) {
              //  const collidingGraphic = new PIXI.Graphics();
              //  const collidingLines = [];
               // gameObject.parent.addChild(collidingGraphic);
              //  col['collidingLines'] = collidingLines;
                col.onLineCollisionStart((line, colB) => {
                  //  collidingLines.push(line);
                    if(!gameObject['___collisions']) {
                        gameObject['___collisions'] = 0;
                        gameObject.texture = collide;
                    }
                    gameObject['___collisions']++;
                });
                col.onLineCollisionEnd((line, colB) => {
                    if(!(--gameObject['___collisions'])) {
                        gameObject.texture = noCollide;
                        delete gameObject['___collisions']
                    }
                });
            }
        },
        onRemoved(col) {
      //      console.log('trying to remove"', col['debugid']);
            let found = false;
        //    console.error('removed', col);
            for(let i = 0; i < addedColliders.length; i++) {
                if(addedColliders[i] === col) {
                    addedColliders.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if(!found)  {
                console.error('collider:', col);
                throw new Error('Collider was not tracked');
            }
            if(col.tags) {
                handleRemoveColliderTag(col, col.tags, false);
            } else {
                handleRemoveColliderTag(col, NO_TAG_CONSTANT, true);
            }

            if(col[PLUGIN_GO_CONSTANT]) {
                //  col[PLUGIN_GO_CONSTANT].removeEventListener('pointerover');
                //  col[PLUGIN_GO_CONSTANT].removeEventListener('pointerout');
                if(col[PLUGIN_GO_CONSTANT].layerParent) {
                    col[PLUGIN_GO_CONSTANT].removeFromMap();
                }
                delete col[PLUGIN_GO_CONSTANT];
            }
            //console.log('debug plugin onRemoved:', col);
        },
    }
};

