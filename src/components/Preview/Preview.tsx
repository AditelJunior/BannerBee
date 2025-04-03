import React, { useState, useEffect, useRef, } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";

import { storage } from "../../firebase";

import JSZip from "jszip";
import { saveAs } from "file-saver";

import * as htmlToImage from 'html-to-image';
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';

import { File } from "../../../types/types";
import './styles.scss';

type BannerSize = {
    width?: number,
    height?: number,
}

interface PreviewProps {
    sessionName: string | null;
    html?: string | '';
    allUploadedFiles?: File[] | [];
}

const Preview = ({html, allUploadedFiles, sessionName}: PreviewProps) => {
    const [htmlPreviewFull, setHtmlPreviewFull] = useState<boolean>(false);
    const [iframeSize, setIframeSize] = useState<BannerSize>({width: 0, height: 0})
    const iframeRef = useRef <HTMLIFrameElement> (null)
    useEffect(() => {
        if(html) {
            getAdSize(html)
        }
    }, [html])
    

    function reloadHtmlPreview() {
        let htmlPreview:any =  document.getElementById('html_preview')
        htmlPreview.contentWindow.location.reload();
      }
  
     function fullScreeHtmlPreview() {
        let previewWrap: any = document.getElementById('preview_wrap');
        if(htmlPreviewFull) {
           previewWrap.classList.remove("html_preview_full_screen_active");
           setHtmlPreviewFull(false);
        } else {
           previewWrap.classList.add("html_preview_full_screen_active");
           setHtmlPreviewFull(true);
        }
    }
    async function downloadHtml(html:any) {
        if(!html) {
            return alert("HTML is empty")
        }
        const [newHtml, imgsFromHtml] = await replaceHtmlUrls(html);
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
        const backupImageBlob = htmlToImage.toBlob(iframeRef.current!, { quality: 1, pixelRatio: 1}).then((blob)=> {
            if (blob) return blob
                return Promise.reject(alert('Backup image failed to load'))
        })

        zip.file(backupImageName, backupImageBlob!)
        zip.file('index.html', htmlBlobPromise)
        zip.generateAsync({type:"blob"})
            .then(blob => saveAs(blob, iframeSize.width ? (iframeSize.width+'X'+iframeSize.height) : sessionName!))
            .catch(e => console.log(e));
        
    }
    function getAdSize (htmlString:any) {
        const match = htmlString.match(/<meta\s+name=["']ad\.size["']\s+content=["']width=(\d+),height=(\d+)["']/);
        
        if (match) {
            setIframeSize({
                width: parseInt(match[1], 10),
                height: parseInt(match[2], 10)
            })
        }
    }
    async function replaceHtmlUrls(html:any) {
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
    return (
        <div id="preview_wrap" onClick={(e)=> htmlPreviewFull ? fullScreeHtmlPreview() : null }>
            <div className="html_preview_control">
                <button className="preview_control_button button_no_style" disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); reloadHtmlPreview()}}>Reload</button>
                <button className="preview_control_button button_no_style" disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); downloadHtml(html)}}>Download</button>
                {
                    htmlPreviewFull ? 
                    <button className="preview_control_button button_no_style " disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); fullScreeHtmlPreview()}}>Exit Full Screen</button> :
                    <button className="preview_control_button button_no_style" disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); fullScreeHtmlPreview()}}>Enter Full Screen</button>
                }
            </div>
            {!html ? <span>HTML is not generated yet</span> : null}
            <div className="iframe_wrap">
                <iframe 
                    onClick={(e)=> e.preventDefault()} 
                    srcDoc={html} 
                    frameBorder="0" 
                    id="html_preview" 
                    width={iframeSize.width} 
                    height={iframeSize.height}
                    ref={iframeRef}
                    title="preview of the banner genrated by AI"
                ></iframe>
            </div>
        </div>
    )
}

export default Preview;