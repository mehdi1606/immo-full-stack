package com.clubicode.mmomarocback.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "agents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"id", "phone", "agency", "city"})
@EqualsAndHashCode(of = "id")
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String phone;
    private String whatsapp;
    private String agency;
    private String city;
    private String avatar;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer sold = 0;

    @Builder.Default
    private Boolean verified = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "agent_specialties", joinColumns = @JoinColumn(name = "agent_id"))
    @Column(name = "specialty")
    @Builder.Default
    private Set<String> specialties = new LinkedHashSet<>();

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Property> properties = new ArrayList<>();
}
