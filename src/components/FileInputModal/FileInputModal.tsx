import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { File } from "../../../types/types";
import { RootState } from "../../state/store";
import { useHomeContext } from '../../context/HomeContext';

import './styles.scss';


const FileInputModal = () => {
    const filesInputModal = useSelector((state:RootState) => state.filesInputModal.open);
    const [filesState, setFilesState] = useState<any[]>([]);
    const {inputFiles, setInputFiles} = useHomeContext();
    
    const dispatch = useDispatch();

    type FileSize = {
        width: number | 0,
        height: number | 0,
    }
    
    function saveFilesInState() {
        const modalInput:any = document.getElementById('modalInput');
        const fileDescs = modalInput.querySelectorAll('[data-file_desc]');

        let filesArr:File[] = [];
        
        for(let i=0;i<filesState.length;i++) {
            let fileItem:File;
            let  imgSize:any = checkImageSize(filesState[i]);

            if(filesState[i]) {
                fileItem = {
                    file: filesState[i], 
                    description: fileDescs[i].value, 
                    size: {
                        width: imgSize.width, height: imgSize.height
                    },
                    url: URL.createObjectURL(filesState[i]),
                }
                filesArr.push(fileItem)
            }
        }
        setInputFiles([...inputFiles, ...filesArr]);
    }

    async function checkImageSize(file:any) {
        if(!file) {
            return {width: 0, height: 0};
        }
        const img = document.createElement("img");
        const promise = new Promise((resolve, reject) => {
            img.onload = () => {
               const width:number  = img.naturalWidth;
               const height:number = img.naturalHeight;

               resolve({ width: width, height: height});
            };
            // Reject promise on error
            img.onerror = reject;
        });
        // Setting the source makes it start downloading and eventually call `onload`
        img.src = window.URL.createObjectURL(file);
        await promise.then((value:any) => {
            return value;
        }).catch((error) => {
            console.error(error);
        });
        return {width: 0, height: 0};
    }
    function handleFilesState(changedFiles:FileList) {
        let filesArr:any[] = [];
        for (let i = 0; i < changedFiles.length; i++) {
            filesArr.push(changedFiles[i])
        }
        setFilesState(filesArr);
    }
        
    return (
        <div className={`modal ${filesInputModal ? 'modal_open' :''}`} id="modalInput">
            <button onClick={(e)=>{dispatch({type: 'filesInputModal/close'})}} className="close_modal button_no_style">✕</button>
            <div>
                <div className="input_wrap">
                    <input type="file" id="files_input" multiple accept="image/png, image/jpeg, image/gif, image/svg+xml" onChange={(e) => ( e.target.files ? handleFilesState(e.target.files) : null )}/>
                    <button className="clear_input_button button_no_style" onClick={(e:any)=>{e.target.parentElement.querySelector("[type=file]").value = ''; setFilesState([])}}>✕</button>
                </div>
                <div className="desc_wrap">
                {
                    filesState.map((file:any, id:number) => {
                        return (
                            <div key={id} className="desc_row">
                                <label htmlFor={'desc'+id}>{file.name}</label>
                                <input type="text" id={'desc_'+id} className="file_description" placeholder="File desctiption" data-file_desc/>
                            </div>
                            
                        )
                    })
                }
                </div>
            </div>
            {
                filesState.length > 0
                    ? <button className="button_no_style submit_input_files" onClick={()=>{saveFilesInState(); dispatch({type: 'filesInputModal/close'})}}>Submit</button>
                    : null
            }
        </div>
    )
}

export default FileInputModal;