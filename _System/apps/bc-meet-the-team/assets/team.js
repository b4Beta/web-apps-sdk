var WEBAPP_NAME = "Meet The Team";
var WEBAPP_PHOTO_FOLDER = "/bc-meet-the-team/images/";
var WEBAPP_SLUG = "bc-meet-the-team";
var MEMBER_DEFAULT_PHOTO = WEBAPP_PHOTO_FOLDER + "unknown.png";

var WEBAPP_CUSTOM_FIELDS = [
    {
        "name":"Position",
        "type":"String",
        "required":true
    },
    {
        "name":"Bio",
        "type":"String_MultiLine",
        "required":false
    },
    {
        "name":"Picture",
        "type":"String",
        "required":false
    },
    {
        "name":"Facebook",
        "type":"String",
        "required":false
    },
    {
        "name":"Twitter",
        "type":"String",
        "required":false
    },
    {
        "name":"Linkedin",
        "type":"String",
        "required":false
    }
];


function bootStrap() {
    var webApp = new BCAPI.Models.WebApp.App({name: WEBAPP_NAME});
    webApp.fetch({
        success: loadTeamMembers,
        error: tryWebAppCreate
    });
}

function loadTeamMembers(data) {
    var members = new BCAPI.Models.WebApp.ItemCollection(WEBAPP_NAME);
    members.fetch({
		order: "name",
        skip: 0,
        limit: 1000, //no pagination
        success: onMemberListFetch,
        error: onAPIError
    });
};

function tryWebAppCreate(data, xhr) {
    createWebApp(WEBAPP_NAME, WEBAPP_CUSTOM_FIELDS, loadTeamMembers);
}


function createWebApp(name, fields, callback) {
    var webApp = new BCAPI.Models.WebApp.App({
        name: WEBAPP_NAME,
        slug: WEBAPP_SLUG,
        allowFileUpload: true,
        uploadFolder: WEBAPP_PHOTO_FOLDER
    });

    webApp.save({
        success: function(app) {
            createCustomFields(app, fields, callback);
        },

        error: function(data, xhr) {
            systemNotifications.showError("Could not create webapp");
        }
    })
}

function createCustomFields(webApp, fields, successCallback) {
    var callAfterAllFieldsCreated = _.after(fields.length, successCallback);

    _.each(fields, function(field) {
       var customField = new BCAPI.Models.WebApp.CustomField(webApp.get('name'), field);
        customField.save({
            success: callAfterAllFieldsCreated,
            error: function(data, xhr) {
                systemNotifications.showError("Failed to create custom field " + field.name);
            }
        })
    });
}

/*
 * Event handlers for the list page
 */
function onMemberListFetch(data) {
    $(".loading").hide(); // hide the loading indicator
    
    var templateText = $("#member-card-loading").html();
    
    _.each(data.models, function(member) {
        // First, add item to the view, with loading indicator
        var context = {"member": member};
    	var itemHtml = _.template(templateText, context);
        $("#team-members").append(itemHtml);
        
        // we need to fetch each item to get to the custom field
        member.fetch({
            success: onMemberFetch,
            error: onAPIError
        });
    })
};

function onMemberFetch(data) {
    var templateText = $("#member-card").html();
    if (data.get('fields').Picture == null || data.get('fields').Picture.length  == 0) {
        data.get('fields').Picture = "assets/images/unknown.png";
    }
    var context = {"member": data};
    var itemHtml = _.template(templateText, context);
    
    var loadingCard = $("div[data-member-id=loading-" + data.get("id") +"]");
    if(loadingCard) {
        loadingCard.replaceWith(itemHtml)
    } else {
    $("#team-members").append(itemHtml);
    }
    
    // initialize clickover component
    $('a[rel="popover"]').clickover( {html: true});
    $(".card-actions").on("shown", persistActionsCard);
    $(".card-actions").on("hidden", restoreActionsCard);

};

function restoreActionsCard(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $("#" + evt.currentTarget.id).attr("class", "card-actions");

}

function persistActionsCard(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $("#" + evt.currentTarget.id).attr("class", "card-actions-persistent");
}

function onAPIError(data, xhr, options) {
    showErrorMessage(xhr, "API Error");
};

function deleteTeamMember(memberId) {
    var member = new BCAPI.Models.WebApp.Item(WEBAPP_NAME);
    member.id = memberId;
    member.destroy({
        success: onMemberDeleted,
        error: onAPIError
    });
}

function onMemberDeleted(member) {
    $("div[data-member-id='" + member.id +"']").remove();
    systemNotifications.showSuccess('Deleted', 'Team member removed')
}

/*
 * Create / Edit page functions
 */

// store the reference to the selected file
// so we can do deferred upload, even from dnd
var userImageFile;

function previewImage(input) {
    if (input.files && input.files[0]) {
        userImageFile = input.files[0];
        $("#member-picture-name").val(userImageFile.name);
        var reader = new FileReader();
        reader.onload = function (e) {
            //the only jQuery line.  All else is the File API.
            $('#preview').attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    previewImage(evt.dataTransfer);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function onMemberDetailsFetch(member) {
    renderMemberDetailsForm(member);
}


function renderMemberDetailsForm(memberObject) {
    var templateText = $("#member-edit-form-template").html();

    var context = {"member": memberObject};
    $("#form-container").html(_.template(templateText, context));

    // show unknow image when the photo is missing
    if (memberObject.get('fields').Picture == null || memberObject.get('fields').Picture.length == 0) {
        $("#preview").attr("src", "assets/images/unknown.png");
    }

    // Check for the various File API support.
    if ((typeof window.File == "undefined") 
        || (typeof window.FileReader == "undefined") 
        || (typeof window.FileList == "undefined")
        || (typeof window.Blob == "undefined")) {
        //we don't have needed File API support, hide file upload
        $('.upload-not-supported').show();
        $('.trigger-info').hide();
    }
    else {
        // setup file upload hooks for drag'n'drop
        // and client-side preview functionality
        $('.upload-not-supported').hide();

        $('#upload-trigger').click(function() {
            $('#member-picture-select').click();
        });
    }


    // Setup the dnd listeners
    var dropZone = document.getElementById('member-picture');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);

    // Attach form submit event handler

    $('#member-form-submit').click(onMemberFormSubmit);
    $("#member-form-cancel").click(onMemberFormLeave);

    $('.tab-pane input[type=text]').change(checkSocialTab);
    $.validator.messages.required = "This field is required";
    
}


function checkSocialTab(evt) {
    var inputId = evt.target.id;
    var socialTabId = inputId.replace("member", "tab");

    if ($("#" + inputId).val().length > 0) {
	    $("#" + socialTabId).addClass("checked");
    } else {
	    $("#" + socialTabId).removeClass("checked");
    }
}

function onMemberFormSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    enableButtons(false);

    $("#member-edit-form").validate({
        showErrors: function(errorMap, errorList) {

            $.each( this.successList , function(index, value) {
                $(value).popover('hide');
            });

            if (errorList.length > 0) {
	            var value = errorList[0];
                var _popover = $(value.element).popover({
                    trigger: 'manual',
                    placement: 'top',
                    content: "This field is required",
                    template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><div class="popover-content"><p></p></div></div></div>'
                });

                _popover.data('popover').options.content = value.message;

                $(value.element).popover('show');

                enableButtons(true);
            }
        }
    });

    if ($("#member-edit-form").valid()) {
        saveMember(getMemberIdFromUrl());
    }
}

function saveMember(memberId) {
    var memberPicture = $("#member-picture-name").val();
    var member = new BCAPI.Models.WebApp.Item(WEBAPP_NAME);
    if (memberId) {
        member.set('id', memberId);
    }
    member.set({
        name: $('#member-name').val(),
        fields: {
            Position: $('#member-position').val(),
            Bio: $('#member-bio').val(),
            Facebook: $('#member-facebook').val(),
            Twitter: $('#member-twitter').val(),
            Linkedin: $('#member-linkedin').val(),
            Picture: MEMBER_DEFAULT_PHOTO
        }
    });

    if (userImageFile) {
        var memberImage = new BCAPI.Models.FileSystem.File({
    	    parent: new BCAPI.Models.FileSystem.Folder(WEBAPP_PHOTO_FOLDER),
    	    name: memberPicture
    	});
        if (memberPicture && memberPicture.length > 0) {
            member.get("fields").Picture = WEBAPP_PHOTO_FOLDER + memberPicture;
        }
        
        memberImage.upload(userImageFile)
            .done(function() {
                member.save({ contentType: 'application/json',
                    success: onMemberSaveSuccess,
                    error: onMemberSaveError
                })
            })
            .fail(onMemberUploadError);
    } else {
        if (memberPicture && memberPicture.length > 0) {
            member.get("fields").Picture = memberPicture;
        }

        member.save({
            success: onMemberSaveSuccess,
            error: onMemberSaveError
        });
    }
}

function onMemberUploadError(xhr, textStatus, errorThrown){
    enableButtons(true);

    showErrorMessage(xhr, "File Upload Error");
}

function onMemberSaveError(data, xhr, options){
    enableButtons(true);

    onAPIError(data, xhr, options);
}

function onMemberSaveSuccess(member) {
    systemNotifications.showSuccess("Operation successful", "Member details saved successfully");
    setTimeout(function() {
        onMemberFormLeave();
    }, 1000);
}

function onMemberFormLeave(evt) {
    window.location = 'index.html';
}

// enable - boolean desired state of buttons
function enableButtons(enabled) {
    $('.control-group .controls .btn').prop('disabled', !enabled);
}

function showErrorMessage(xhr, title) {
    var errorMessage = "Unknown error.";
    if (xhr.responseText) {
        errorMessage = "Server error. Error code: " + JSON.parse(xhr.responseText).code;
    }
    systemNotifications.showError( (typeof title != undefined) ? title : "Error", errorMessage);
}

/*
 * Utility functions
 */

/* Function to read the query parameters from url*/

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getMemberIdFromUrl() {
    var queryParams = getUrlVars();
    return queryParams.memberid || null;
}
