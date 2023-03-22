const DisplayTodoList=()=>{
    let All_item_notes = localStorage.getItem("All_item_notes");
    if (!All_item_notes) notes = [];
    else notes = JSON.parse(All_item_notes);
    let html = "";
    for(let index=0;index<notes.length;index++) {
       html +=`
       <div id="${index}" class="notes__list-item notes__list-item--selected" onclick="OpenNote(this.id)">
            <div class="notes__small-title">${notes[index].split(',')[0]}</div>
            <div class="notes__small-body">${notes[index].split(',')[1]}</div>
            <div>
                <div class="notes__small-updated">
                <button id="${index}" onclick="DelNoteItem(this.id)" class="Delete"></button>   
                ${notes[index].split(',')[2]}
                </div>
            </div>
        </div>
       `;
    }
    let localStorage_Notes = document.getElementById("All_item_notes");
    if (notes.length == 0)
       localStorage_Notes.innerHTML = `No Notes Currently ):`;
    else
       localStorage_Notes.innerHTML = html;
 }

 document.getElementById("notes__add").addEventListener("click", ()=>{
    let todoText = document.getElementById("notes__body");
    let todoTitle = document.getElementById("notes__title");
    let date = new Date(Date.now());
    var dateStr = date.getFullYear().toString() + "/" + 
                  (date.getMonth()+1).toString() +  "/" + 
                  date.getDate().toString() + "    " + 
                  date.getHours().toString() +  ":" + 
                  date.getMinutes().toString() +  ":" + 
                  date.getSeconds().toString() +  ":" +
                  date.getMilliseconds().toString();
    if(!(todoText.value)){
       alert("Please write something to create Note")
       return;
    }
    if(!(todoTitle.value)){
        alert("Please give your Note a Title")
        return;
     }
    let All_item_notes = localStorage.getItem("All_item_notes");
    if (!All_item_notes) NoteListObj = [];
    else
    NoteListObj = JSON.parse(All_item_notes);
    NoteListObj.push(todoTitle.value + "," + todoText.value + "," + dateStr);
    localStorage.setItem("All_item_notes", JSON.stringify(NoteListObj));
    todoText.value = "";
    todoTitle.value = "";
    DisplayTodoList();

 });
 const DelNoteItem=(ind)=>{
    let All_item_notes = localStorage.getItem("All_item_notes");
    if (All_item_notes != null)
    notes = JSON.parse(All_item_notes);
    notes.splice(ind, 1);
    let str_notes=JSON.stringify(notes);
    localStorage.setItem("All_item_notes",str_notes);
    DisplayTodoList();
 }
 const OpenNote=(ind)=>{
    let todoText = document.getElementById("notes__body");
    let todoTitle = document.getElementById("notes__title");
    let All_item_notes = localStorage.getItem("All_item_notes");
    if (All_item_notes != null)
    notes = JSON.parse(All_item_notes);
    todoText.value = notes[ind].split(',')[1];
    todoTitle.value = notes[ind].split(',')[0];
    DelNoteItem(ind);
 }
 DisplayTodoList();