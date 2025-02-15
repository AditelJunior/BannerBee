import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { File } from "../../../types/types";
import { RootState } from "../../state/store";
import { useHomeContext } from '../../context/HomeContext';

const FileInputModal = () => {
    const filesInputModal = useSelector((state:RootState) => state.filesInputModal.open);
    const { inputFiles, setInputFiles } = useHomeContext();
    
    const dispatch = useDispatch();

    function saveFilesInState() {
        const modalInputs:any = document.getElementById('modalInputs');
        const fileInputs = modalInputs.querySelectorAll('[type=file]');
        const fileDescs = modalInputs.querySelectorAll('[data-file_desc]');

        let filesArr:File[] = [];

        for(let i=0;i<fileInputs.length;i++) {
            let fileItem:File;
            if(fileInputs[i].files[0]) {
                fileItem = {
                    file: fileInputs[i].files[0], 
                    description: fileDescs[i].value, 
                    size: {
                        width: fileInputs[i].getAttribute('data-image_width'), 
                        height: fileInputs[i].getAttribute('data-image_height')
                    },
                    url: URL.createObjectURL(fileInputs[i].files[0]),
                }
                filesArr.push(fileItem)
            }
        }
        setInputFiles([...inputFiles, ...filesArr]);
    }

    function checkImageSize(e:any) {
        if(!e.files[0]) {
            return
        }
        const img = document.createElement("img");
        const promise = new Promise((resolve, reject) => {
            img.onload = () => {
               const width:number  = img.naturalWidth;
               const height:number = img.naturalHeight;

               resolve({width: width, height: height});
            };
            // Reject promise on error
            img.onerror = reject;
        });
        // Setting the source makes it start downloading and eventually call `onload`
        img.src = window.URL.createObjectURL(e.files[0]);

        promise.then((value:any) => {
            e.setAttribute("data-image_width", value.width);
            e.setAttribute("data-image_height", value.width);
        }).catch((error) => {
            console.error(error);
        });

        return promise;
    }
        
    let inputsQuantity = 8;
    return (
        <div className={`modal ${filesInputModal ? 'modal_open' :''}`} id="modalInputs">
        <button onClick={(e)=>{dispatch({type: 'filesInputModal/close'})}} className="close_modal button_no_style">✕</button>
        <div className="input_list">
            {[...Array(inputsQuantity)].map((el, i)=> {
                return (
                    <div className="inputs_row" key={i}>
                    <div className="input_wrap">
                        <input type="file" accept="image/png, image/jpeg, image/gif, image/svg+xml" onChange={(e)=>checkImageSize(e.target)}/>
                        <button className="clear_input_button button_no_style" onClick={(e:any)=>{e.target.parentElement.querySelector("[type=file]").value = ''}}>✕</button>
                    </div>
                    
                    <div>
                        <input type="text" className="file_description" placeholder="File desctiption" data-file_desc/>
                    </div>
                    </div>
                )
            })}
        </div>
        <button className="button_no_style submit_input_files" onClick={()=>{saveFilesInState(); dispatch({type: 'filesInputModal/close'})}}>Submit</button>
        </div>
    )
}

export default FileInputModal;