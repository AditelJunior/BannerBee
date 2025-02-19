import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { File } from "../../../types/types";
import './styles.scss';

type BannerSize = {
    width?: number,
    height?: number,
}

interface PreviewProps {
    sessionName: string;
    html?: string;
    allUploadedFiles?: File[] | [];
}

const Preview = ({html, allUploadedFiles, sessionName}: PreviewProps) => {
    const [htmlPreviewFull, setHtmlPreviewFull] = useState<boolean>(false);
    const [iframeSize, setIframeSize] = useState<BannerSize>({width: 0, height: 0})

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
    function downloadHtml(html:any) {
        if(!html) {
            return alert("HTML is empty")
        }

        const [newHtml, imgsFromHtml] = replaceHtmlUrls(html)
        const zip = new JSZip()
        // in case if folder is needed
        const folder:any = zip.folder('images')
        if(imgsFromHtml.length > 0) {
            imgsFromHtml.forEach((file:any) => {
                const blobPromise = fetch(file.url).then(r => {
                    if (r.status === 200) return r.blob()
                    return Promise.reject(new Error(r.statusText))
                })
                const name = file.file.name;
                folder.file(name, blobPromise)
            })
        }
        const htmlBlobPromise = fetch("data:text/html;charset=utf-8," + encodeURIComponent(newHtml)).then(r => {
            if (r.status === 200) return r.blob()
            return Promise.reject(new Error(r.statusText))
        });
        zip.file('index.html', htmlBlobPromise)
        zip.generateAsync({type:"blob"})
            .then(blob => saveAs(blob, sessionName))
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
    function replaceHtmlUrls(html:any) {
        let imgsFromHtml:File[] = [];
        if(allUploadedFiles)  {
            for(let i = 0; i < allUploadedFiles.length; i++) {
                if(html.includes(allUploadedFiles[i].url)) {
                    imgsFromHtml.push(allUploadedFiles[i]);
                    html = html.replaceAll(`${allUploadedFiles[i].url}`, `./images/${allUploadedFiles[i].file.name}`)
                }
            }
        }
        
        return [html, imgsFromHtml];
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
                    title="preview of the banner genrated by AI"
                ></iframe>
            </div>
        </div>
    )
}

export default Preview;