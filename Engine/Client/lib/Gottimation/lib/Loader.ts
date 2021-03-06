// @ts-ignore
import {dataUrlToTexture} from "../utils";

// @ts-ignore
const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
    // @ts-ignore
    IDBTransaction : IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
    dbVersion = 1.0;

export class Loader {
    protected db : IDBDatabase;
    readonly name: string;
    constructor(name: string, db?: IDBDatabase) {
        // @ts-ignore
        this.db = db;
        this.name = name;
    }
    public async initialize() : Promise<boolean> {
        if(this.db) return true;
        const request = indexedDB.open(this.name, dbVersion);
        return new Promise((resolve, reject) => {
            request.onerror = function (event) {
                console.error("Error creating/accessing IndexedDB database", event);
            };

            request.onsuccess = (event) => {
                this.db = request.result;
                this.db.onerror = function (event) {
                    console.error("Error creating/accessing IndexedDB database", event);
                    return reject(`Error creating/accessing IndexedDB database`)
                };

                // Interim solution for Google Chrome to create an objectStore. Will be deprecated
                // @ts-ignore
                if (this.db.setVersion) {
                    if (this.db.version != dbVersion) {
                        // @ts-ignore
                        const setVersion = this.db.setVersion(dbVersion);
                        setVersion.onsuccess = function () {
                            this.db.createObjectStore(this.name);
                            return resolve(true);
                        };
                    }
                    else {
                        this.db.createObjectStore(this.name);
                        return resolve(true);
                    }
                } else {
                    return resolve(true);
                }
            }

            // For future use. Currently only in latest Firefox versions
            request.onupgradeneeded = (event) => {
                // @ts-ignore
                this.db = event.target.result;
                this.db.createObjectStore(this.name);
            };
        })
    }

    public async deleteItem(name: string) : Promise<boolean> {
        const transaction = this.db.transaction([this.name], 'readwrite');
        const request = transaction.objectStore(this.name).delete(name);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                return resolve(true)
            };
            request.onerror = (event: Event) => {
                return reject(`Error saving texture to indexedDB: ${name}`)
            };
        });
    }


    public async saveBlob(name: string, data: Blob) : Promise<boolean> {
        const transaction = this.db.transaction([this.name], 'readwrite');
        const request = transaction.objectStore(this.name).put(data, name);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                return resolve(true)
            };
            request.onerror = (event: Event) => {
                return reject(`Error saving blob to indexedDB: ${name}`)
            };
        });
    }

    public async loadBlob(name: string, decode?: (blob: Blob) => any) : Promise<Blob> {
        const transaction = this.db.transaction([this.name], 'readonly');
        const request = transaction.objectStore(this.name).get(name)
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                try {
                    if(decode) {
                        // @ts-ignore
                        decode(event.target.result).then(res => {
                            return resolve(res)
                        })
                    } else {
                        // @ts-ignore
                        return resolve(event.target.result);
                    }
                } catch (err) {
                    return resolve(null)
                }
            };
            request.onerror = (event: Event) => {
                return reject(Error(`Error getting texture from indexedDB: ${name}`));
            };
        });
    }

    public async saveJson(name: string, data: any) : Promise<boolean> {
        const transaction = this.db.transaction([this.name], 'readwrite');
        const request = transaction.objectStore(this.name).put(JSON.stringify(data), name);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                return resolve(true)
            };
            request.onerror = (event: Event) => {
                return reject(`Error saving texture to indexedDB: ${name}`)
            };
        });
    }

    public async loadJson(name: string, dontParse=false) : Promise<any> {
        const transaction = this.db.transaction([this.name], 'readonly');
        const request = transaction.objectStore(this.name).get(name)
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                try {
                    // @ts-ignore
                    const res = dontParse ? event.target.result : JSON.parse(event.target.result);
                    return resolve(res);
                } catch (err) {
                    return resolve(null)
                }
            };
            request.onerror = (event: Event) => {
                return reject(Error(`Error getting texture from indexedDB: ${name}`));
            };
        });
        return null;
    }

    public async saveTexture(name: string, texture: PIXI.Texture) : Promise<boolean> {
        const transaction = this.db.transaction([this.name], 'readwrite');
        const canvas = document.createElement('canvas');
        canvas.width = texture.baseTexture.width;
        canvas.height = texture.baseTexture.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(texture.baseTexture.source, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        const request = transaction.objectStore(this.name).put(dataURL, name);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                return resolve(true)
            };
            request.onerror = (event: Event) => {
                return reject(`Error saving texture to indexedDB: ${name}`)
            };
        });
    }
    public async saveImageData(name: string, dataUrl: Blob | string) {
        const transaction = this.db.transaction([this.name], 'readwrite');
        const request = transaction.objectStore(this.name).put(dataUrl, name);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                return resolve(true)
            };
            request.onerror = (event: Event) => {
                return reject(`Error saving texture to indexedDB: ${name}`)
            };
        });
    }

    public async loadImageData(name: string) : Promise<Blob | string> {
        const transaction = this.db.transaction([this.name], 'readonly');
        const request = transaction.objectStore(this.name).get(name)
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                // @ts-ignore
                const imgFile = event.target.result;
                return resolve(imgFile);
            };
            request.onerror = (event: Event) => {
                throw new Error(`Error getting texture from indexedDB: ${name}`);
            };
        });
        return null;
    }

    public async loadTexture (name: string) : Promise<PIXI.Texture> {
        const transaction = this.db.transaction([this.name], 'readonly');
        const request = transaction.objectStore(this.name).get(name)
        return new Promise((resolve, reject) => {
            request.onsuccess = async (event: Event) => {
                // @ts-ignore
                const imgFile = event.target.result;
                const texture = imgFile ? await dataUrlToTexture(imgFile) : null;
                return resolve(texture);
            };
            request.onerror = (event: Event) => {
                throw new Error(`Error getting texture from indexedDB: ${name}`);
            };
        });
        return null;
    }
}