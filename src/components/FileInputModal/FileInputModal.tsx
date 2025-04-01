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
    
    async function saveFilesInState() {
        const modalInput:any = document.getElementById('modalInput');
        const filesInput = modalInput.querySelector('[type=file]');

        let filesArr:File[] = [];
        
        for(let i=0;i<filesState.length;i++) {
            let fileItem:File;
            let imgSize:any = await checkImageSize(filesState[i].file);
            fileItem = {
                file: filesState[i].file, 
                description: filesState[i].description, 
                size: {
                    width: imgSize.width, height: imgSize.height
                },
                url: URL.createObjectURL(filesState[i].file),
            }
            filesArr.push(fileItem)
        }
        setInputFiles(filesArr);
        filesInput.value = '';
        setFilesState([])
    }

    async function checkImageSize(file:any) {
        let imgSize = {width: undefined, height: undefined}

        if(!file) {
            return imgSize;
        }
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
               const width:number  = img.naturalWidth;
               const height:number = img.naturalHeight;
               resolve({ width: width, height: height});
            };
            // Reject promise on error
            img.onerror = ()=> {return imgSize};
            img.src = URL.createObjectURL(file);
        });
    }

    type FileLocal = {
        id: number,
        file: any,
        description?: string
    }
    function handleFilesState(changedFiles:FileList) {
        let filesArr:FileLocal[] = [];
        for (let i = 0; i < changedFiles.length; i++) {
            filesArr.push({
                id: Date.now() + Math.random(),
                file: changedFiles[i],
                description: '',
            });
        }
        setFilesState((prev) => [...prev, ...filesArr]);
    }

    function handleDescriptionChange (id: number, description: string) {
        setFilesState(prev =>
            prev.map(item =>
                item.id === id ? { ...item, description: description } : item
            )
        );
    };
        
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
                            <div className="desc_row_wrap" key={id}>
                                <div className="desc_row">
                                    <label htmlFor={'desc_'+id}>{file.file.name}</label>
                                    <input 
                                        type="text"
                                        id={'desc_'+id}
                                        value={file.description}
                                        onChange={(e) => handleDescriptionChange(file.id, e.target.value)}
                                        className="file_description"
                                        placeholder="File desctiption"
                                        data-file_desc/>
                                </div>
                                <div>
                                    <button className="button_no_style" onClick={(e) => setFilesState((prev)=> prev.filter((prev,i) => i !== id))}>✕</button> 
                                </div>
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