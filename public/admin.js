$(document).ready(function() {
    const apiUrl = "http://localhost:3000/leads";

    function loadLeads(situacaoFilter = "") {
        let url = apiUrl;
        if (situacaoFilter) {
            url += `?situacao=${situacaoFilter}`;
        }

        $.ajax({
            url: url,
            method: "GET",
            success: function(data) {
                $('#leadsTable tbody').empty();
                data.forEach(lead => {
                    $('#leadsTable tbody').append(`
                        <tr>
                            <td>${lead.name}</td>
                            <td>${lead.email}</td>
                            <td>${lead.celular}</td>
                            <td>${lead.genero}</td>
                            <td>${lead.situacao}</td>
                            <td>
                                <button onclick="openEditModal(${lead.id}, '${lead.name}', '${lead.email}', '${lead.celular}', '${lead.genero}', '${lead.situacao}')">Alterar</button>
                                <button onclick="deleteLead(${lead.id})">Remover</button>
                            </td>
                        </tr>
                    `);
                });
            },
            error: function(err) {
                alert("Erro ao carregar leads!");
            }
        });
    }

    window.openEditModal = function(id, name, email, celular, genero, situacao) {
        $("#editName").val(name);
        $("#editEmail").val(email);
        $("#editCelular").val(celular);
        $("#editGenero").val(genero);
        $("#editSituacao").val(situacao);
        $("#editId").val(id);
        $("#editModal").modal('show');
    }

    $("#editForm").on("submit", function(event) {
        event.preventDefault();

        const leadData = {
            id: $("#editId").val(),
            name: $("#editName").val(),
            email: $("#editEmail").val(),
            celular: $("#editCelular").val(),
            genero: $("#editGenero").val(),
            situacao: $("#editSituacao").val()
        };

        $.ajax({
            url: `${apiUrl}/${leadData.id}`,
            method: "PUT",
            data: leadData,
            success: function() {
                loadLeads();
                $("#editModal").modal('hide');
                alert("Lead atualizado com sucesso!");
            },
            error: function() {
                alert("Erro ao atualizar lead!");
            }
        });
    });

    window.deleteLead = function(id) {
        if (confirm("Tem certeza de que deseja remover este lead?")) {
            $.ajax({
                url: `${apiUrl}/${id}`,
                method: "DELETE",
                success: function() {
                    loadLeads();
                    alert("Lead removido com sucesso!");
                },
                error: function() {
                    alert("Erro ao remover lead!");
                }
            });
        }
    }

    $('#applyFilter').click(function() {
        const selectedSituacao = $("#filterSituacao").val();
        loadLeads(selectedSituacao);
    });

    loadLeads();
});
