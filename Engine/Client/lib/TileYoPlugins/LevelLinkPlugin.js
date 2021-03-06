const LevelLinkPlugin = (tagAs=['client_player'], tagBs=['level_link']) => {
    const levelValidators = {};
    let dynamicResolver;
    let levelIsChanging = true;
    let hasValidLevelChange = false;
    let pendingLevelChangeValidation = false;
    let world;
    let centerCameraAt = null;
    let isDynamicProp = 'is_dynamic';
    let toLevelNameProp = 'to_level';
    let toPositionXProp = 'to_x';
    let toPositionYProp = 'to_y';

    let genericValidator;

    let positionResolver;

    return {
        type: 'collision',
        name: 'level_link',
        tagAs: [...tagAs],
        tagBs: [...tagBs],
        init(w, opts) {
            if(opts) {
                if(opts.positionResolver) {
                    positionResolver = opts.positionResolver;
                }
                if(opts.validator) {
                    genericValidator = opts.validator;
                }
                if(opts.validatorByLevel) {
                    Object.keys(opts.validatorByLevel).forEach(mapName => {
                        levelValidators[mapName] = opts.validatorByLevel[mapName];
                    })
                }
                if(opts.toLevelNameProp) {
                    toLevelNameProp = opts.toLevelNameProp;
                }
                if(opts.toPositionXProp) {
                    toPositionXProp = opts.toPositionXProp;
                }
                if(opts.toPositionYProp) {
                    toPositionYProp = opts.toPositionYProp;
                }
                if(opts.isDynamicProp) {
                    isDynamicProp = opts.isDynamicProp;
                }
            }
            dynamicResolver = opts && opts.dynamicResolver ? opts.dynamicResolver : null;
            world = w;
            world.onMapDestroyed(() => {
                levelIsChanging = true;
                hasValidLevelChange = false;
            });
            world.onMapCreated(() => {
                levelIsChanging = false;
                pendingLevelChangeValidation = false;
            });
        },
        onAfterCollisions() {
            if(hasValidLevelChange !== false && !levelIsChanging) {
                const cameraPosition = centerCameraAt ? { ...centerCameraAt } : null;
                centerCameraAt = null;
                levelIsChanging = true;
                const levelToLoad =  hasValidLevelChange;
                hasValidLevelChange = false;
                !world.isLoadingMap && world.loadMap(levelToLoad, { cameraPosition })
            }
        },
        async onCollisionStart(colA, colB) {
            if(pendingLevelChangeValidation) return;
            if(colB.props[isDynamicProp]) {
                pendingLevelChangeValidation = true;
                if(!dynamicResolver) {
                    throw new Error('Level link with isDynamic prop was set to true, but there is no dynamic level resolver set in the plugin opts.')
                }
                const resolved = await dynamicResolver(colA, colB)
                if(resolved) {
                    if(!('x' in resolved) || !('y' in resolved) || !('level' in resolved)) {
                        throw new Error(`Dynamic resolves should return an object in the shape of { level: string, x: number, y: number }, where level is the level you want to load, and x and y is where you want to the camera to be positioned.`)
                    }
                    const { x, y, level } = resolved;

                    let valid = genericValidator ? await genericValidator(levelName, colA, colB) : true;

                    if(valid && levelValidators[level]) {
                        valid = await levelValidators[level](colA, colB);
                    }
                    if(valid) {
                        centerCameraAt = { x, y };
                        hasValidLevelChange = level;
                    }
                }
                pendingLevelChangeValidation = false;
            } else {
                const levelName =colB.props[toLevelNameProp];
                const x = colB.props[toPositionXProp] || 0;
                const y = colB.props[toPositionYProp] || 0;

                let valid = genericValidator ? await genericValidator(levelName, colA, colB) : true;

                if(valid && levelValidators[levelName]) {
                    pendingLevelChangeValidation = true;
                    valid = await levelValidators[levelName](colA, colB);
                    pendingLevelChangeValidation = false;
                }
                if(valid) {
                    centerCameraAt = positionResolver ? positionResolver(levelName, colA, colB) : { x, y };
                    centerCameraAt = { x, y };
                    hasValidLevelChange = levelName;
                }
            }
        },
        async onCollision(colA, colB) {
            if(!pendingLevelChangeValidation && !levelIsChanging) {
                if(colB.props[isDynamicProp]) {
                    pendingLevelChangeValidation = true;
                    if(!dynamicResolver) {
                        throw new Error('Level link with isDynamic prop was set to true, but there is no dynamic level resolver set in the plugin opts.')
                    }
                    const resolved = await dynamicResolver(colA, colB)
                    if(resolved) {
                        if(!('x' in resolved) || !('y' in resolved) || !('level' in resolved)) {
                            throw new Error(`Dynamic resolves should return an object in the shape of { level: string, x: number, y: number }, where level is the level you want to load, and x and y is where you want to the camera to be positioned.`)
                        }
                        const { x, y, level } = resolved;
                        let valid = true;
                        if (levelValidators[level]) {
                            valid = await levelValidators[level](colA, colB);
                        }
                        if (valid) {
                            centerCameraAt = { x, y };
                            hasValidLevelChange = level;
                        }
                    }
                    pendingLevelChangeValidation = false;
                } else {
                    const levelName = colB.props[toLevelNameProp];
                    const x = colB.props[toPositionXProp] || 0;
                    const y = colB.props[toPositionYProp] || 0;
                    let valid = true;
                    if(levelValidators[levelName]) {
                        pendingLevelChangeValidation = true;
                        valid = await levelValidators[levelName](colA, colB);
                        pendingLevelChangeValidation = false;
                    }
                    if(valid) {
                        centerCameraAt = positionResolver ? positionResolver(levelName, colA, colB) : { x, y };
                        hasValidLevelChange = levelName;
                    }
                }
            }
        }
    }
}

export { LevelLinkPlugin };