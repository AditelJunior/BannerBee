import React, { useEffect, useState } from 'react';
import { getDocs, collection } from "firebase/firestore";
import { storage, auth } from "../../firebase";

import { db } from '../../firebase'
import { setTemplate, removeTemplate } from "../../state/pickedTemplate/pickedTemplate";
import { setCurrentPreview } from '../../state/sessionsList/sessionsList';
import { useDispatch } from "react-redux";
import './styles.scss';


interface LibraryProps {
    modalOpen: boolean,
    setModalOpen: (open: boolean) => void;
}
type LibraryItem ={
    id: string,
    title: string,
    image: string,
    html: string,
}

const Library = ({modalOpen, setModalOpen}:LibraryProps) => {
    const [libraryListState, setLibraryListState] = useState <LibraryItem[]>([])

    const dispatch = useDispatch();
    useEffect(()=> {
        getLibrary();
    }, []);
    const getLibrary = async () => {
        
        const libraryDocs = await getDocs(collection(db, "library"));
    
        let libraryList:any[] = [];

        libraryDocs.forEach((doc) => {

            libraryList.push({id: doc.id, ...doc.data()});
        });
        setLibraryListState(libraryList)
        // localStorage.setItem('library', JSON.stringify(libraryList));
   }
    return (
        <div className={`modal_library ${modalOpen ? 'modal_open' :''}`} id="modalLibrary">
            <button onClick={(e)=>setModalOpen(false)} className="close_modal button_no_style">✕</button>
            <div className='library_list'>
                {
                    libraryListState.map((item, i) => {
                        return (
                            <button 
                                key={i} 
                                onClick={(e) => {dispatch(setTemplate({
                                        html: item.html, 
                                        id: item.id, 
                                        image: item.image, 
                                        title: item.title})); 
                                    setModalOpen(false); 
                                    dispatch(setCurrentPreview(item.html))}}
                                className='library_card button_no_style'>
                                <img src={item.image} alt={` ${item.title}`} />
                                <p>{item.title}</p>
                            </button>
                        )
                    })
                }
            </div>
        </div>
    );
};

export default Library;