import React, { useState, useEffect, useRef, } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";

import { storage } from "../../firebase";

import JSZip from "jszip";
import { saveAs } from "file-saver";

import * as htmlToImage from 'html-to-image';

type BannerSize = {
    width?: number,
    height?: number,
}

export async function downloadHtml(html:any, iframeSize:BannerSize, sessionName:string | null, iframeRef:any, backupImage:boolean) {
    if(!html) {
        return alert("HTML is empty")
    }
    const [newHtml, imgsFromHtml] = await replaceHtmlUrls(html, sessionName);
    const zip = new JSZip()
    // in case if folder is needed
    const folder:any = zip.folder('images')

    if(imgsFromHtml.length > 0) {
        imgsFromHtml.forEach((file:any) => {
            const blobPromise = fetch(file.url).then(r => {
                if (r.status === 200) return r.blob()
                return Promise.reject(new Error(r.statusText))
            })
            const name = file.name;
            folder.file(name, blobPromise)
        })
    }
    const htmlBlobPromise = fetch("data:text/html;charset=utf-8," + encodeURIComponent(newHtml)).then(r => {
        if (r.status === 200) return r.blob()
        return Promise.reject(new Error(r.statusText))
    });
    const backupImageName = `BACKUP_IMAGE-${iframeSize.width ? (iframeSize.width+'X' + iframeSize.height) : sessionName}.jpeg`;
    const backupImageBlob = htmlToImage.toBlob(iframeRef.current?.contentDocument?.querySelector('html')!, { quality: 1, pixelRatio: 1}).then((blob)=> {
        if (blob) return blob
            return Promise.reject(alert('Backup image failed to load'))
    })
    if(backupImage === true) {
        zip.file(backupImageName, backupImageBlob!)
    }
    zip.file('index.html', htmlBlobPromise)
    zip.generateAsync({type:"blob"})
        .then(blob => saveAs(blob, iframeSize.width ? (iframeSize.width+'X'+iframeSize.height) : sessionName!))
        .catch(e => console.log(e));
    
}

export async function replaceHtmlUrls(html:any, sessionName:string | null) {
    let imgsFromHtml: {name: string, url: string}[] = [];

    if (sessionName) {
        const listRef = ref(storage, sessionName);

        try {
            const res = await listAll(listRef); // Wait for all items to be listed
            const fetchUrls = res.items.map(async (itemRef) => {
                try {
                    const url = await getDownloadURL(itemRef);

                    if(html.includes(url)) {
                        imgsFromHtml.push({ name: itemRef.name, url: url });

                        // Replace all occurrences of the URL in the HTML
                        html = html.replaceAll(url, `./images/${itemRef.name}`);
                    }
                } catch (error) {
                    console.error(`Failed to get download URL for ${itemRef.name}:`, error);
                }
            });

            await Promise.all(fetchUrls); // Wait for all URLs to be fetched and replaced

        } catch (error) {
            console.error("Error listing files:", error);
        }
    }

    return [html, imgsFromHtml]; // Ensure modified HTML and URLs are returned
}