import React, { useEffect, useState } from 'react';
import { getDocs, collection } from "firebase/firestore";
import { storage, auth } from "../../firebase";

import { db } from '../../firebase'
import './styles.scss';


interface LibraryProps {
    modalOpen: boolean,
    setModalOpen: (open: boolean) => void;
}
type LibraryItem ={
    title: string,
    image: string,
    html: string,
}

const Library = ({modalOpen, setModalOpen}:LibraryProps) => {
    const [libraryListState, setLibraryListState] = useState <LibraryItem[]>([])

    useEffect(()=> {
        getLibrary();
    }, []);
    const getLibrary = async () => {
        // console.log(localStorage.getItem('library'))
        // // if (localStorage.getItem('library')) {
            
        // // }
        const libraryDocs = await getDocs(collection(db, "library"));
    
        let libraryList:any[] = [];

        libraryDocs.forEach((doc) => {
            // console.log(doc.data());
            libraryList.push(doc.data());
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
                            <button key={i} className='library_card button_no_style'>
                                <img src={item.image} alt={` ${item.title}`} />
                                <p>{item.title}</p>
                            </button>
                            
                        )
                    })
                }
                {
                    libraryListState.map((item, i) => {
                        return (
                            <button key={i} className='library_card button_no_style'>
                                <img src={item.image} alt={` ${item.title}`} />
                                <p>{item.title}</p>
                            </button>
                            
                        )
                    })
                }
                {
                    libraryListState.map((item, i) => {
                        return (
                            <button key={i} className='library_card button_no_style'>
                                <img src={item.image} alt={` ${item.title}`} />
                                <p>{item.title}</p>
                            </button>
                        )
                    })
                }
                {
                    libraryListState.map((item, i) => {
                        return (
                            <button key={i} className='library_card button_no_style'>
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