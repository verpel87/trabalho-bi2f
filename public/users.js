// users.js
$(document).ready(function() {
    function loadUsers() {
        $.ajax({
            url: "http://localhost:3000/api/users",
            method: "GET",
            success: function(data) {
                $('#usersTable tbody').empty();
                data.forEach(user => {
                    $('#usersTable tbody').append(`
                        <tr>
                            <td>${user.username}</td>
                            <td>
                                <button onclick="deleteUser('${user.username}')">Remover</button>
                            </td>
                        </tr>
                    `);
                });
            },
            error: function(err) {
                alert("Erro ao carregar usuários!");
                console.error("Erro ao carregar usuários: ", err);
            }
        });
    }

	$("#addUserModalBtn").click(function() {
		// Limpa os campos do formulário
		$("#newUsername").val('');
		$("#newPassword").val('');

		// Abre o modal
		$("#addUserModal").modal('show');
	});

    $("#addUserForm").on("submit", function(event) {
        event.preventDefault();

        const username = $("#newUsername").val();
        const password = $("#newPassword").val();

        $.ajax({
            url: "http://localhost:3000/register",
            method: "POST",
            data: { username: username, password: password },
            success: function() {
                loadUsers();
                $("#addUserModal").modal('hide');
                alert("Usuário inserido com sucesso!");
            },
            error: function(err) {
                alert("Erro ao inserir usuário!");
                console.error("Erro ao inserir usuário: ", err);
            }
        });
    });

    window.deleteUser = function(username) {
        // Aqui, eu presumo que você possa querer implementar uma rota DELETE em server.js para remover usuários.
        // Este é apenas um exemplo.
		if (username === 'admin') {
        alert('O usuário "admin" não pode ser removido.');
        return;
		}
        if (confirm("Tem certeza de que deseja remover este usuário?")) {
            $.ajax({
                url: `http://localhost:3000/users/${username}`,
                method: "DELETE",
                success: function() {
                    loadUsers();
                    alert("Usuário removido com sucesso!");
                },
                error: function(err) {
                    alert("Erro ao remover usuário!");
                    console.error("Erro ao remover usuário: ", err);
                }
            });
        }
    }

    // Carregando os usuários inicialmente
    loadUsers();
});
