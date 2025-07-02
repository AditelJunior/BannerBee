import React, { useState, useEffect, useRef, } from "react";

import { File } from "../../../types/types";
import './styles.scss';
import {downloadHtml, replaceHtmlUrls} from './previewFunctions';

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
    const [backupImage, setBackupImage] = useState<boolean>(true);
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

    function getAdSize (htmlString:any) {
        const match = htmlString.match(/<meta\s+name=["']ad\.size["']\s+content=["']width=(\d+),height=(\d+)["']/);
        
        if (match) {
            setIframeSize({
                width: parseInt(match[1], 10),
                height: parseInt(match[2], 10)
            })
        }
    }

    return (
        <div id="preview_wrap" onClick={(e)=> htmlPreviewFull ? fullScreeHtmlPreview() : null }>
            <div className="html_preview_control">
                <button className="preview_control_button button_no_style" disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); reloadHtmlPreview()}}>Reload</button>
                <button className="preview_control_button button_no_style" disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); downloadHtml(html, iframeSize, sessionName, iframeRef, backupImage)}}>Download</button>
                {
                    htmlPreviewFull ? 
                    <button className="preview_control_button button_no_style " disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); fullScreeHtmlPreview()}}>Exit Full Screen</button> :
                    <button className="preview_control_button button_no_style" disabled={html ? false : true} onClick={(e)=>{e.stopPropagation(); fullScreeHtmlPreview()}}>Enter Full Screen</button>
                }
                <div className="switch_backup_wrap">
                    <input type="checkbox" id="switchBackup" onClick={() => setBackupImage(!backupImage)} checked={backupImage}/><label htmlFor="switchBackup">Backup image</label>
                </div>
            </div>
            {!html ? <span className="preview_not_generated_label">HTML is not generated yet</span> : null}
            <div className="iframe_wrap">
                <iframe 
                    onClick={(e)=> e.preventDefault()} 
                    srcDoc={html} 
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